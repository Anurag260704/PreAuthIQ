"""Legacy re-export — prefer core.report.assemble_report."""

from core.report.builder import assemble_report as assemble
from core.report.errors import AssemblyError

__all__ = ["AssemblyError", "assemble"]
