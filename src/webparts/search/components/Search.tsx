import * as React from "react";
import { useState } from "react";
import styles from "../SearchWebPart.module.scss";
import { Search20Regular } from "@fluentui/react-icons";

const SEARCH_EVENT = "dashboard-search";

const Search: React.FC = () => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setValue(text);

    window.dispatchEvent(
      new CustomEvent(SEARCH_EVENT, {
        detail: { text },
      })
    );
  };

  return (
    <div>
      <div
        style={{
          width: "100%",
          // marginBottom: 16,
          display: "flex",
          alignItems: "center",
          border: isFocused ? "2px solid #000" : "1px solid #D6D6D6",
          padding: "6px 10px",
          borderRadius: 40,
          background: "#FFF",
          boxSizing: "border-box",
          gap: 8,
          transition: "border 0.2s ease",
        }}
      >
        <input
          type="text"
          placeholder="Pesquisar..."
          value={value}
          onChange={onChange}
          autoComplete="off"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: 14,
            background: "transparent",
          }}
        />

        <Search20Regular color={isFocused ? "#000" : "#333"} />
      </div>
    </div>
  );
};

export default Search;
