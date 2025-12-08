import * as React from "react";

interface ISelectedSectorContext {
  selectedSector: number | null;
  setSelectedSector: (sectorId: number) => void;
}

export const SelectedSectorContext = React.createContext<
  ISelectedSectorContext | undefined
>(undefined);

export const SelectedSectorProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [selectedSector, setSelectedSector] = React.useState<number | null>(
    null
  );

  return (
    <SelectedSectorContext.Provider
      value={{ selectedSector, setSelectedSector }}
    >
      {children}
    </SelectedSectorContext.Provider>
  );
};

export const useSelectedSector = () => {
  const context = React.useContext(SelectedSectorContext);
  if (!context) {
    throw new Error(
      "useSelectedSector deve ser usado dentro de SelectedSectorProvider"
    );
  }
  return context;
};
