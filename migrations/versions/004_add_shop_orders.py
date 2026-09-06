"""Add shop_orders and shop_order_items tables

Revision ID: 004_add_shop_orders
Revises: 003_add_orders_and_card_order_id
Create Date: 2026-08-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision: str = "004_add_shop_orders"
down_revision: Union[str, None] = "003_add_orders_and_card_order_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create shop_orders table
    op.create_table(
        "shop_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("shop_order_number", sa.String(length=32), nullable=False),
        sa.Column("customer_name", sa.String(length=255), nullable=False),
        sa.Column("customer_email", sa.String(length=255), nullable=False),
        sa.Column("customer_phone", sa.String(length=64), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("shipping_address", sa.Text(), nullable=False),
        sa.Column("shipping_city", sa.String(length=100), nullable=False),
        sa.Column("shipping_postal_code", sa.String(length=32), nullable=False),
        sa.Column("shipping_notes", sa.Text(), nullable=True),
        sa.Column("total_amount", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("payment_status", sa.String(length=30), nullable=False, server_default="MOCK_PAID"),
        sa.Column("payment_reference", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="PLACED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_shop_orders_shop_order_number", "shop_orders", ["shop_order_number"], unique=True)

    # 2. Create shop_order_items table
    op.create_table(
        "shop_order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("shop_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("shop_orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_type", sa.String(length=20), nullable=False),
        sa.Column("product_title", sa.String(length=255), nullable=False),
        sa.Column("unit_price", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("destination_type", sa.String(length=50), nullable=False),
        sa.Column("destination_url", sa.String(length=2048), nullable=True),
        sa.Column("destination_configured", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("fulfillment_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_shop_order_items_shop_order_id", "shop_order_items", ["shop_order_id"], unique=False)
    op.create_index("ix_shop_order_items_fulfillment_order_id", "shop_order_items", ["fulfillment_order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_shop_order_items_fulfillment_order_id", table_name="shop_order_items")
    op.drop_index("ix_shop_order_items_shop_order_id", table_name="shop_order_items")
    op.drop_table("shop_order_items")
    op.drop_index("ix_shop_orders_shop_order_number", table_name="shop_orders")
    op.drop_table("shop_orders")
