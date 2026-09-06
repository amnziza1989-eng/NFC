"""Add QC fields to cards

Revision ID: 002_add_qc_fields
Revises: 001_initial
Create Date: 2026-08-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "002_add_qc_fields"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add QC fields to cards table
    op.add_column("cards", sa.Column("qc_nfc_tested", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("cards", sa.Column("qc_qr_tested", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("cards", sa.Column("qc_destination_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    # Remove QC fields
    op.drop_column("cards", "qc_destination_verified")
    op.drop_column("cards", "qc_qr_tested")
    op.drop_column("cards", "qc_nfc_tested")
