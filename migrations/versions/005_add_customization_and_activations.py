"""Add customization fields to shop_order_items and create card_activation_sessions

Revision ID: 005_add_customization_and_activations
Revises: 004_add_shop_orders
Create Date: 2026-08-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision: str = "005_customization_activations"
down_revision: Union[str, None] = "004_add_shop_orders"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add customization columns to shop_order_items
    op.add_column(
        "shop_order_items",
        sa.Column("customization_logo_url", sa.String(length=2048), nullable=True),
    )
    op.add_column(
        "shop_order_items",
        sa.Column("customization_color", sa.String(length=32), nullable=True, server_default="#0F172A"),
    )
    op.add_column(
        "shop_order_items",
        sa.Column("customization_template", sa.String(length=50), nullable=True, server_default="classic"),
    )

    # 2. Create card_activation_sessions table
    op.create_table(
        "card_activation_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("card_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_card_activation_sessions_token", "card_activation_sessions", ["token"], unique=True)
    op.create_index("ix_card_activation_sessions_card_id", "card_activation_sessions", ["card_id"], unique=False)
    op.create_index("ix_card_activation_sessions_order_id", "card_activation_sessions", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_card_activation_sessions_order_id", table_name="card_activation_sessions")
    op.drop_index("ix_card_activation_sessions_card_id", table_name="card_activation_sessions")
    op.drop_index("ix_card_activation_sessions_token", table_name="card_activation_sessions")
    op.drop_table("card_activation_sessions")

    op.drop_column("shop_order_items", "customization_template")
    op.drop_column("shop_order_items", "customization_color")
    op.drop_column("shop_order_items", "customization_logo_url")
