ALTER TABLE ladder_avatar_preference ADD COLUMN avatar_palette text NOT NULL DEFAULT 'original';
ALTER TABLE ladder_avatar_change ADD COLUMN avatar_palette text NOT NULL DEFAULT 'original';
