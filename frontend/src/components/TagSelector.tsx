import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTags } from '../services/api';
import { Tag } from '../types';

interface TagSelectorProps {
	selectedTags: string[];
	onChange: (tags: string[]) => void;
}

const normalize = (value: string) => value.trim();

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onChange }) => {
	const [availableTags, setAvailableTags] = useState<Tag[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const selectedSet = useMemo(
		() => new Set(selectedTags.map((tag) => tag.toLowerCase())),
		[selectedTags]
	);

	const loadTags = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const tags = await fetchTags();
			setAvailableTags(tags);
		} catch (err) {
			console.error('Error loading tags:', err);
			const message = err instanceof Error ? err.message : 'Failed to load tags.';
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTags();
	}, [loadTags]);

	const handleToggleTag = (tagName: string) => {
		const normalized = normalize(tagName);
		if (!normalized) {
			return;
		}

		const lower = normalized.toLowerCase();
		if (selectedSet.has(lower)) {
			onChange(selectedTags.filter((tag) => tag.toLowerCase() !== lower));
		} else {
			onChange([...selectedTags, normalized]);
		}
	};

	const handleRemoveTag = (tagName: string) => {
		const lower = tagName.toLowerCase();
		onChange(selectedTags.filter((tag) => tag.toLowerCase() !== lower));
	};

	const missingTags = useMemo(
		() =>
			selectedTags.filter(
				(tag) =>
					!availableTags.some((available) => available.name.toLowerCase() === tag.toLowerCase())
			),
		[availableTags, selectedTags]
	);

	return (
		<div className="tag-selector">
			<div className="tag-selector-header">
				<div>
					<h3>🏷️ Choose Tags</h3>
					<p className="tag-selector-helper">
						Select existing tags for this upload. Need something new? Manage your tags separately.
					</p>
				</div>
				<div className="tag-selector-actions">
					<button
						type="button"
						className="refresh-tags-button"
						onClick={loadTags}
						disabled={loading}
					>
						{loading ? 'Refreshing…' : '🔄 Refresh'}
					</button>
					<Link to="/tags" className="manage-tags-link">
						✏️ Manage Tags
					</Link>
				</div>
			</div>

			<div className="tags-section">
				<h4>Selected Tags ({selectedTags.length})</h4>
				<div className="tags-display">
					{selectedTags.length === 0 && (
						<div className="no-tags-message">
							No tags selected yet. Pick from the list below or use an OCR suggestion.
						</div>
					)}
					{selectedTags.map((tag) => (
						<button
							type="button"
							key={tag}
							className={`selected-tag ${missingTags.includes(tag) ? 'new-tag' : ''}`}
							onClick={() => handleRemoveTag(tag)}
							title="Click to remove tag"
						>
							🏷️ {tag} <span>✕</span>
						</button>
					))}
				</div>
				{missingTags.length > 0 && (
					<small className="tag-selector-hint">
						{missingTags.length === 1
							? `${missingTags[0]} isn’t in your saved tags yet. Uploading will create it automatically.`
							: 'Some selected tags are new and will be created when you upload.'}
					</small>
				)}
			</div>

			<div className="tags-section">
				<div className="tag-selector-available-header">
					<h4>Available Tags</h4>
					{availableTags.length > 0 && (
						<span className="tag-count">{availableTags.length}</span>
					)}
				</div>
				{error && (
					<div className="message error">
						{error}
					</div>
				)}
				<div className="tags-display">
					{loading && availableTags.length === 0 && (
						<div className="loading-container">
							<div className="spinner" />
							<span>Loading tags…</span>
						</div>
					)}

					{!loading && availableTags.length === 0 && !error && (
						<div className="no-tags-message">
							No saved tags yet. Visit Manage Tags to add some.
						</div>
					)}

					{availableTags.map((tag) => {
						const isSelected = selectedSet.has(tag.name.toLowerCase());
						return (
							<button
								type="button"
								key={tag.id}
								className={`available-tag ${isSelected ? 'disabled' : ''}`}
								onClick={() => handleToggleTag(tag.name)}
								disabled={isSelected}
								title={isSelected ? 'Already selected' : 'Click to add tag'}
							>
								{isSelected ? '✓' : '+'} {tag.name}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default TagSelector;
