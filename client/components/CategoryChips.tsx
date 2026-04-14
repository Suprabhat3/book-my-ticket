import React from "react";

const categories = ["All Movies", "Action", "Sci-Fi", "Comedy", "Drama", "Animation"];

export const CategoryChips = () => {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-headline font-extrabold mb-8 flex items-center gap-4">
        <span className="w-12 h-1 bg-primary rounded-full"></span>
        Explore Categories
      </h2>
      <div className="flex flex-wrap gap-4">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={
              i === 0
                ? "bg-tertiary-container text-on-tertiary-container px-8 py-3 rounded-full font-bold shadow-sm clay-inset"
                : "bg-surface-container-highest text-on-surface px-8 py-3 rounded-full font-medium hover:bg-surface-container-high transition-colors"
            }
          >
            {cat}
          </button>
        ))}
      </div>
    </section>
  );
};
