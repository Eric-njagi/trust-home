import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <section className="page">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn secondary">
        Go home
      </Link>
    </section>
  );
};
