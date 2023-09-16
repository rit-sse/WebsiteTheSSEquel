import React, { MouseEvent } from "react";
import Link from "next/link";
import { NavItemProps, OnClickProps } from "./NavItem";

const MobileNavDropdown: React.FC<{ navItems: NavItemProps[] } & OnClickProps> = ({ navItems, onClickFunc }) => {

  const handleNavigationClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClickFunc(e);
  };

  return (
    <ul className="mt-4 dropdown-content menu text-xl rounded-md w-64 shadow-lg shadow-slate-950 bg-slate-800">
      {navItems.map((navItem, index) => (
        <li key={index}>
          {navItem.route ? (
            <Link className="hover:bg-slate-700 focus:bg-slate-700" href={navItem.route} onClick={(e) => handleNavigationClick(e)}>
              <summary>{navItem.title}</summary>
            </Link>
          ) : (
            <details open>
              <summary className="hover:bg-slate-700 focus:bg-slate-700">{navItem.title}</summary>
              <ul>
                {navItem.subItems?.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <Link href={subItem.route || ""} className="hover:bg-slate-700 focus:bg-slate-700" onClick={(e) => handleNavigationClick(e)}>
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