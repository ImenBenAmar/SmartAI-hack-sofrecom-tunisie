"use client";

import FilterAccordion from "./FilterAccordion";
import type { InboxFilters } from "@/types/filters";

interface InboxFilterSectionProps {
  onFiltersChange: (filters: InboxFilters, groupsMap: Map<string, string[]>) => void;
}

export default function InboxFilterSection({ onFiltersChange }: InboxFilterSectionProps) {
  return <FilterAccordion onFiltersChange={onFiltersChange} />;
}
