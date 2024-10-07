"use client";

import { Navbar, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Link } from "@nextui-org/react";
import React, { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth'; // Import Firebase auth functions
import { useRouter } from 'next/navigation'; // Import Next.js router

interface HeaderMainProps {
  className?: string;
}

const HeaderMain: React.FC<HeaderMainProps> = ({ className }) => {
  // State to manage menu open/close status
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter(); // Initialize router for navigation

  const menuItems = [
    "Dashboard",
    "Calendar",
    "Stats",
    "Settings",
    "Trades",
    "Log Out",
  ];

  const handleLogout = async () => {
    const auth = getAuth(); // Get the authentication instance
    try {
      await signOut(auth); // Sign out the user
      router.push('/login'); // Redirect to the login page
    } catch (error) {
      console.error("Logout error:", error); // Handle error if needed
    }
  };

  return (
    <div className={`"z-50 ${className}`}>
      <Navbar onMenuOpenChange={setIsMenuOpen} className="backdrop-blur-none bg-transparent z-50 flex justify-between w-full">
        <div className="z-50 flex w-full h-full items-center">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="ml-4"
          />
          <div className="z-50 flex-grow" />
        </div>
        <NavbarMenu className={`z-50 absolute left-0 bottom-0 h-full transition-width duration-300 ${isMenuOpen ? "w-64" : "w-0"} overflow-hidden`}>
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`} className="w-full">
              <Link
                color={index === menuItems.length - 1 ? "secondary" : "foreground"}
                className="block px-4 py-2"
                onClick={item === "Log Out" ? handleLogout : undefined} // Call handleLogout on click if "Log Out"
                href={item === "Dashboard" ? "/" : `/${item.toLowerCase()}`} // Redirect for other menu items
              >
                {item}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>
    </div>
  );
};

export default HeaderMain;
