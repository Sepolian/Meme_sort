import React from 'react';
import { Link } from 'react-router-dom';
import TagManager from '../components/TagManager';

const ManageTags: React.FC = () => {
	return (
		<div className="manage-tags-page">
			<div className="manage-tags-container">
				<h1 className="page-title">🏷️ Manage Tags</h1>
				<p className="page-subtitle">
					Create and review the tags available across your image library. New tags appear instantly on the
					upload page.
				</p>
				<div className="manage-tags-actions">
					<Link to="/similarity" className="similarity-scan-button">
						🔍 Scan Image Similarity
					</Link>
				</div>
				<TagManager />
				<div className="manage-tags-guide">
					<h4>Tips</h4>
					<ul>
						<li>Keep tag names short and consistent for easier searching.</li>
						<li>Visit the Upload page to attach these tags to new images.</li>
						<li>Need a fresh list? Use the refresh button above after creating tags elsewhere.</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default ManageTags;
