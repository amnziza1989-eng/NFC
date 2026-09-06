"""Add shipping method and notification tracking fields to shop_orders

Revision ID: 006_shipping_notifications
Revises: f84133d70bfb
Create Date: 2026-08-30 01:20:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "006_shipping_notifications"
down_revision: Union[str, None] = "f84133d70bfb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "shop_orders",
        sa.Column("shipping_province", sa.String(length=100), nullable=True, server_default="تهران"),
    )
    op.add_column(
        "shop_orders",
        sa.Column("shipping_method", sa.String(length=32), nullable=False, server_default="POST"),
    )
    op.add_column(
        "shop_orders",
        sa.Column("shipping_notification_status", sa.String(length=30), nullable=False, server_default="NOT_SENT"),
    )
    op.add_column(
        "shop_orders",
        sa.Column("shipping_notification_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "shop_orders",
        sa.Column("shipping_notification_error", sa.Text(), nullable=True),
    )
    op.add_column(
        "shop_orders",
        sa.Column("shipping_notification_provider_ref", sa.String(length=128), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("shop_orders", "shipping_notification_provider_ref")
    op.drop_column("shop_orders", "shipping_notification_error")
    op.drop_column("shop_orders", "shipping_notification_sent_at")
    op.drop_column("shop_orders", "shipping_notification_status")
    op.drop_column("shop_orders", "shipping_method")
    op.drop_column("shop_orders", "shipping_province")
