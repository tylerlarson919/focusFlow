"use client";

import { Navbar, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Link } from "@nextui-org/react";
import React, { useState } from 'react';

const HeaderMain: React.FC = () => {
  // State to manage menu open/close status
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    "Dashboard",
    "Calendar",
    "Stats",
    "Settings",
  ];

  return (
    <div className="z-50">
      <Navbar onMenuOpenChange={setIsMenuOpen} className="z-50 flex justify-between w-full">
        <div className="z-50 flex w-full h-full items-center">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="ml-4"
          />
          <div className="z-50 flex-grow" />
        </div>
        <NavbarMenu className={`z-50 absolute left-0 h-full transition-width duration-300 ${isMenuOpen ? "w-64" : "w-0"} overflow-hidden`}>
        {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`} className="w-full">
                <Link
                color={index === menuItems.length - 1 ? "secondary" : "foreground"}
                className="block px-4 py-2"
                href={item === "Dashboard" ? "/" : `/${item.toLowerCase()}`}
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
