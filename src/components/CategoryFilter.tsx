"use client";

export function CategoryFilter({
  categories,
  selected,
  setSelected,
}: {
  categories: string[];
  selected: string;
  setSelected: (cat: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {categories.map(cat => (
        <button
          key={cat}
          type="button"
          onClick={() => setSelected(cat)}
          className={
            "px-4 py-1 rounded-full border text-sm font-medium transition-colors " +
            (selected === cat
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-transparent hover:border-primary hover:text-primary")
          }
        >
          {cat}
        </button>
      ))}
    </div>
  );
} 