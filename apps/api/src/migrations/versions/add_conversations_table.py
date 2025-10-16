"""Add conversations table

Revision ID: 001_add_conversations
Revises: 
Create Date: 2025-01-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers, used by Alembic
revision = '001_add_conversations'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_name', sa.String(length=100), nullable=False),
        sa.Column('birth_date', sa.String(length=10), nullable=False),
        sa.Column('user_question', sa.String(length=500), nullable=True),
        sa.Column('numbers_calculated', postgresql.JSONB(), nullable=False),
        sa.Column('insight_provided', sa.String(length=2000), nullable=False),
        sa.Column('satisfaction_feedback', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(
        'idx_conversations_user_id',
        'conversations',
        ['user_id'],
        unique=False
    )
    op.create_index(
        'idx_conversations_created_at',
        'conversations',
        ['created_at'],
        unique=False
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_conversations_created_at', table_name='conversations')
    op.drop_index('idx_conversations_user_id', table_name='conversations')
    
    # Drop table
    op.drop_table('conversations')
