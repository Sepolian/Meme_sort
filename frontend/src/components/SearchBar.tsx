import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
    };

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        onSearch(query);
    };

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-container">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Search by tag or OCR text..."
                    className="search-input"
                />
                {query && (
                    <button type="button" className="clear-button" onClick={handleClear}>
                        ✕
                    </button>
                )}
            </div>
            <button type="submit" className="search-button">
                🔍 Search
            </button>
        </form>
    );
};

export default SearchBar;