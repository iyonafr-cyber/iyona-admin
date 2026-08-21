import { useEffect } from "react";
import { useSelector } from "react-redux";
import i18n from "../i18n";
import type { RootState } from "../store/store";

const useSyncI18nWithRedux = (): void => {
  const current = useSelector((state: RootState) => state.language.current);
  useEffect(() => {
    if (i18n.language !== current) {
      void i18n.changeLanguage(current);
    }
  }, [current]);
};

export default useSyncI18nWithRedux;
