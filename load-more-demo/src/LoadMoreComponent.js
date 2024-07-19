import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LoadMoreComponent = () => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8000/items?page=${page}`);
            setItems([...items, ...response.data.items]);
            setPage(page + 1);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ul>
                {items.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
            <button onClick={loadItems} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
            </button>
        </div>
    );
};

export default LoadMoreComponent;
