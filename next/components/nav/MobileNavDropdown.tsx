import Link from "next/link";
import React, { MouseEvent } from "react";
import AuthButton from "./AuthButton";
import { NavItemProps, OnClickProps } from "./NavItem";

const MobileNavDropdown: React.FC<{ navItems: NavItemProps[] } & OnClickProps> = ({ navItems, onClickFunc }) => {

  const handleNavigationClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClickFunc(e);
  };

  return (
    <ul className="mt-4 menu dropdown-content text-xl rounded-md w-64 shadow-lg shadow-base-300 bg-background">
      {navItems.map((navItem, index) => (
        navItem.title === "Login" ? (
                                <li className="" key={index}>
                                 <div className="p-0">
                                    <AuthButton /> 
                                 </div>
                                  
                                </li>
                            ) : (
        <li className="list-none" key={index}>
          {navItem.route ? (
            
            <Link className="hover:bg-secondary focus:bg-secondary" href={navItem.route} onClick={(e) => handleNavigationClick(e)}>
              <summary>{navItem.title}</summary>
            </Link>
          ) : (
            <details>
              <summary className="hover:bg-secondary focus:bg-secondary">{navItem.title}</summary>
              <ul>
                {navItem.subItems?.map((subItem, subIndex) => (
                  <li className="list-none" key={subIndex}>
                    <Link href={subItem.route || ""} className="hover:bg-secondary focus:bg-secondary" onClick={(e) => handleNavigationClick(e)}>
                      <summary>{subItem.title}</summary>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </li>
      )))}
    </ul>
  );
};

export default MobileNavDropdown;