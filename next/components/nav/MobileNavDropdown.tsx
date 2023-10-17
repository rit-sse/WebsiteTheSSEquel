import React, { MouseEvent } from "react";
import Link from "next/link";
import { NavItemProps, OnClickProps } from "./NavItem";

const MobileNavDropdown: React.FC<{ navItems: NavItemProps[] } & OnClickProps> = ({ navItems, onClickFunc }) => {

  const handleNavigationClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClickFunc(e);
  };

  return (
    <ul className="mt-4 menu dropdown-content text-xl rounded-md w-64 shadow-lg shadow-base-300 bg-base-100">
      {navItems.map((navItem, index) => (
        <li key={index}>
          {navItem.route ? (
            <Link className="hover:bg-secondary focus:bg-secondary" href={navItem.route} onClick={(e) => handleNavigationClick(e)}>
              <summary>{navItem.title}</summary>
            </Link>
          ) : (
            <details>
              <summary className="hover:bg-secondary focus:bg-secondary">{navItem.title}</summary>
              <ul>
                {navItem.subItems?.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <Link href={subItem.route || ""} className="hover:bg-secondary focus:bg-secondary" onClick={(e) => handleNavigationClick(e)}>
                      <summary>{subItem.title}</summary>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
};

export default MobileNavDropdown;