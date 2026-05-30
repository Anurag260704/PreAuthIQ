"""Report assembly package."""

from core.report.builder import assemble_report
from core.report.errors import AssemblyError

__all__ = ["AssemblyError", "assemble_report"]
