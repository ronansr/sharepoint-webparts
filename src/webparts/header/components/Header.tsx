import * as React from "react";
import { SearchBox } from "@fluentui/react";
import Search from "../../search/components/Search";
import UserProfile from "../../dashboard/components/UserProfile";
import { WebPartContext } from "@microsoft/sp-webpart-base";

interface HeaderProps {
  logoSrc: string;
  logoAlt?: string;
  context: WebPartContext;

  //   onSearch?: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  logoSrc,
  logoAlt = "Logo",
  context,
  //   onSearch,
}) => {
  return (
    <div
      style={{
        width: "100%",
        background: "#E4E4E4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 0px",
        boxSizing: "border-box",
        minHeight: 80, // header mais confortável
      }}
    >
      {/* 🔹 Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
        }}
      >
        <img
          src={logoSrc}
          alt={logoAlt}
          style={{
            minHeight: 45,
            maxHeight: 45,
            objectFit: "contain",
            paddingLeft: 15,
          }}
        />
      </div>

      {/* 🔍 Search */}
      <div
        style={{
          //   width: 400,
          maxWidth: "100%",
          padding: "0 29px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Search />
        <div style={{ marginLeft: 20 }}>
          <UserProfile context={context} />
        </div>
      </div>

      {/* <div>
      </div> */}
    </div>
  );
};

export default Header;
