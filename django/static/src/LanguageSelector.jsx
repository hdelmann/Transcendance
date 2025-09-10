import { useState } from "react";
import { useTranslation } from "react-i18next";
import Cookies from "universal-cookie";

function LanguageSelector() {
    const { t, i18n: { changeLanguage, language } } = useTranslation();
    const cookies = new Cookies();
    const langList = [
        ["en", "🇬🇧"],
        ["fr", "🇫🇷"],
        ["es", "🇲🇽"]
    ];


    const handleLanguageChange = (event) => {
        const selectedLang = event.target.value;
        changeLanguage(selectedLang);
        cookies.set("lang", selectedLang, {maxAge: 60*60*24*31*6, path: "/"});
    };

    return (
        <>
            <select className="form-select form-select-sm" style={{marginLeft: "1.5em"}} aria-label=".form-select-sm example" defaultValue={language} onChange={handleLanguageChange}>
                {langList.map((telugu) =>
                    <option key={telugu[0]} value={telugu[0]}>{telugu[1]}</option>
                )}
            </select>
        </>
    );
}

export default LanguageSelector;