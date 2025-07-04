import {
  HomeIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export const navigationLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    name: "Import Quote",
    href: "/import",
    icon: ArrowUpTrayIcon,
  },
  {
    name: "New Quote",
    href: "/quotes/new",
    icon: DocumentPlusIcon,
  },
  {
    name: "Search Quotes",
    href: "/search",
    icon: MagnifyingGlassIcon,
  },
  {
    name: "All Quotes",
    href: "/quotes",
    icon: DocumentTextIcon,
  },
  {
    name: "Components",
    href: "/components-demo",
    icon: SparklesIcon,
  },
];