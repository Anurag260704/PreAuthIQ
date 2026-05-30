"""Enrich report payload from structured case input."""

from __future__ import annotations

from typing import List

from core.report.context import AssemblyContext
from core.report.payload_utils import (
    contains_excerpt,
    dedupe_strings,
    get_criteria_results,
    get_string_list,
    get_supporting_evidence,
    join_sentences,
    join_with_semicolon,
)


def promote_case_derived_context(context: AssemblyContext) -> None:
    payload = context.payload
    case_input = context.case_input
    criteria_results = get_criteria_results(payload)

    missing_records = (case_input.missing_records or "").strip()
    complications = (case_input.complications_red_flags or "").strip()
    contradiction = (case_input.contradictory_flags or "").strip()
    adl_source = (
        case_input.functional_impairment_adls.source
        if case_input.functional_impairment_adls
        else None
    )
    adl_value = (
        case_input.functional_impairment_adls.value
        if case_input.functional_impairment_adls
        else None
    )

    for result in criteria_results:
        criterion_id = result.get("criterion_id")
        criterion_name = str(result.get("criterion_name") or "").lower()
        gap_text = str(result.get("gap_or_risk") or "")
        evidence_text = str(result.get("supporting_evidence") or "")

        if criterion_id == "C2" and contradiction:
            joined = f"{evidence_text} {gap_text}".lower()
            if contradiction.lower() not in joined and "pcp" not in joined:
                result["gap_or_risk"] = join_sentences(gap_text, contradiction)

        if criterion_id == "C2" and case_input.objective_neurologic_deficits:
            deficit_value = case_input.objective_neurologic_deficits.value or ""
            if deficit_value.strip():
                result["status"] = "MET"
                if not evidence_text:
                    result["supporting_evidence"] = deficit_value
                source = case_input.objective_neurologic_deficits.source
                if source and source.lower() not in str(
                    result.get("supporting_evidence") or ""
                ).lower():
                    result["supporting_evidence"] = join_with_semicolon(
                        str(result.get("supporting_evidence") or ""),
                        f"Source: {source}",
                    )

        if criterion_id == "C4":
            if adl_value and not evidence_text:
                result["supporting_evidence"] = adl_value
                evidence_text = adl_value
            if adl_source and adl_source.lower() not in evidence_text.lower():
                result["supporting_evidence"] = join_with_semicolon(
                    evidence_text, f"Source: {adl_source}"
                )
            if missing_records and missing_records.lower() not in gap_text.lower():
                result["gap_or_risk"] = join_sentences(gap_text, missing_records)
            if result.get("status") == "MET" and missing_records:
                result["status"] = "PARTIAL"

        if criterion_id == "C5":
            if complications.lower() not in evidence_text.lower():
                result["supporting_evidence"] = join_with_semicolon(
                    evidence_text, complications
                )
            if missing_records and missing_records.lower() not in gap_text.lower():
                result["gap_or_risk"] = join_sentences(gap_text, missing_records)
            site_of_care = (case_input.site_of_care or "").lower()
            if "inpatient" in site_of_care and missing_records:
                result["status"] = "PARTIAL"

        if criterion_id == "C6" and (
            "prerequisite" in criterion_name or "policy" in criterion_name
        ):
            if missing_records:
                result["status"] = "PARTIAL"
                result["gap_or_risk"] = join_sentences(gap_text, missing_records)


def ensure_missing_information(context: AssemblyContext) -> None:
    payload = context.payload
    case_input = context.case_input
    missing_information = dedupe_strings(get_string_list(payload, "missing_information"))

    if case_input.missing_records:
        lower_missing = case_input.missing_records.lower()
        if "adl" in lower_missing or "functional" in lower_missing:
            missing_information.append(
                "Latest surgeon note should explicitly document ADL impairment "
                "attributable to the cervical myelopathy."
            )
        if any(token in lower_missing for token in ("asc", "outpatient", "unsafe")):
            missing_information.append(
                "Request should explicitly justify why outpatient/ASC care is unsafe "
                "and why inpatient monitoring is medically necessary."
            )

    complications = case_input.complications_red_flags or ""
    if "fall" in complications.lower():
        missing_information.append(
            "Provide updated documentation linking gait instability or near-falls "
            "to the inpatient site-of-care request."
        )

    for result in get_criteria_results(payload):
        status = result.get("status")
        if status not in {"PARTIAL", "UNMET"}:
            continue
        gap_or_risk = result.get("gap_or_risk")
        if isinstance(gap_or_risk, str) and gap_or_risk.strip():
            missing_information.append(gap_or_risk.strip())

    payload["missing_information"] = dedupe_strings(missing_information)


def ensure_provider_query(context: AssemblyContext) -> None:
    payload = context.payload
    case_input = context.case_input
    recommendation = str(payload.get("recommendation") or "")
    if recommendation != "NEED_MORE_INFO":
        return

    existing_query = str(payload.get("provider_query") or "").strip()
    query_parts: List[str] = []
    lower_query = existing_query.lower()
    missing_records = (case_input.missing_records or "").lower()
    complications = (case_input.complications_red_flags or "").lower()
    comorbidities = ", ".join(case_input.secondary_diagnoses or [])

    if "adl" in missing_records or "functional" in missing_records:
        if not any(token in lower_query for token in ("adl", "daily living", "functional")):
            query_parts.append(
                "Please document specific ADL or functional impairment attributable "
                "to the condition, including tasks such as buttoning, dropping objects, "
                "or unsafe stair use."
            )

    if any(token in missing_records for token in ("asc", "outpatient", "unsafe")):
        if not any(
            token in lower_query
            for token in ("inpatient", "outpatient", "asc", "site-of-care", "site of care")
        ):
            site_rationale = (
                "Please explain why outpatient/ASC care is unsafe and why inpatient "
                "monitoring is medically necessary."
            )
            if comorbidities:
                site_rationale = (
                    f"{site_rationale} Address relevant comorbidities or risks: {comorbidities}."
                )
            query_parts.append(site_rationale)

    if "fall" in complications and "fall" not in lower_query:
        query_parts.append(
            "Please document gait instability or recent falls/near-falls that support "
            "the requested level of care."
        )

    if query_parts:
        payload["provider_query"] = " ".join(
            [part for part in [existing_query, *query_parts] if part]
        )


def ensure_supporting_evidence(context: AssemblyContext) -> None:
    payload = context.payload
    case_input = context.case_input
    supporting_evidence = get_supporting_evidence(payload)

    if case_input.complications_red_flags and "fall" in case_input.complications_red_flags.lower():
        if not contains_excerpt(supporting_evidence, "fall"):
            supporting_evidence.append(
                {
                    "source": "Case input - complications/red flags",
                    "excerpt": case_input.complications_red_flags,
                }
            )

    if case_input.functional_impairment_adls and case_input.functional_impairment_adls.value:
        if not contains_excerpt(
            supporting_evidence, case_input.functional_impairment_adls.value
        ):
            source = (
                case_input.functional_impairment_adls.source
                or "Case input - functional impairment"
            )
            supporting_evidence.append(
                {
                    "source": source,
                    "excerpt": case_input.functional_impairment_adls.value,
                }
            )

    payload["supporting_evidence"] = supporting_evidence


def ensure_summary_demographics(context: AssemblyContext) -> None:
    payload = context.payload
    case_input = context.case_input
    summary = str(payload.get("clinical_summary") or "").strip()
    if not summary:
        return

    age = case_input.age
    sex = (case_input.sex or "").strip()
    if age is None and not sex:
        return

    summary_lower = summary.lower()
    has_age = age is not None and str(age) in summary_lower
    has_sex = bool(sex) and sex.lower() in summary_lower
    if has_age or has_sex:
        return

    demographic_parts: list[str] = []
    if age is not None:
        demographic_parts.append(f"{age}-year-old")
    if sex:
        demographic_parts.append(sex.lower())
    demographic_prefix = " ".join(demographic_parts).strip()
    if demographic_prefix:
        payload["clinical_summary"] = f"{demographic_prefix} patient. {summary}"


def run_case_context_stage(context: AssemblyContext) -> None:
    promote_case_derived_context(context)


def run_post_adjudication_enrichment_stage(context: AssemblyContext) -> None:
    ensure_missing_information(context)
    ensure_provider_query(context)
    ensure_supporting_evidence(context)
    ensure_summary_demographics(context)
