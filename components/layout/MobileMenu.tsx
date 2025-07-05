"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationLinks } from "@/lib/constants";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                    <span className="sr-only">Close sidebar</span>
                    <span className="text-white text-xl" aria-hidden="true">×</span>
                  </button>
                </div>
              </Transition.Child>
              
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4 shadow-xl">
                <div className="flex h-16 shrink-0 items-center border-b border-slate-800">
                  <h1 className="text-xl font-bold text-white">CarpentryQS</h1>
                </div>
                
                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-2">
                    {navigationLinks.map((link) => {
                      const isActive = pathname === link.href;
                      
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={onClose}
                            className={`
                              group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200
                              ${isActive 
                                ? "bg-green-500 text-white shadow-md" 
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                              }
                            `}
                          >
                            {link.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}