"""Add orders table and card order_id foreign key

Revision ID: 003_add_orders_and_card_order_id
Revises: 002_add_qc_fields
Create Date: 2026-08-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision: str = "003_add_orders_and_card_order_id"
down_revision: Union[str, None] = "002_add_qc_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create orders table
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_number", sa.String(length=32), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("businesses.id"), nullable=False),
        sa.Column("destination_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("product_type", sa.String(length=20), nullable=False, server_default="NFC_QR"),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="CREATED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_orders_order_number", "orders", ["order_number"], unique=True)
    op.create_index("ix_orders_business_id", "orders", ["business_id"], unique=False)

    # 2. Add order_id foreign key to cards table
    op.add_column(
        "cards",
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=True),
    )
    op.create_index("ix_cards_order_id", "cards", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_cards_order_id", table_name="cards")
    op.drop_column("cards", "order_id")
    op.drop_index("ix_orders_business_id", table_name="orders")
    op.drop_index("ix_orders_order_number", table_name="orders")
    op.drop_table("orders")
