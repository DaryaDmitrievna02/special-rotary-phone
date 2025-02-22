import { useRef, useLayoutEffect, useState, useEffect } from "react";
import StartGame from "./game/main";
import "./style.css";

function App() {
    const ref = useRef(null);
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        window.addEventListener("resize", () => {
            setWidth(window.innerWidth);
        });

        return () => {
            window.removeEventListener("resize", () => {});
        };
    }, [window.innerWidth]);

    useLayoutEffect(() => {
        let game: Phaser.Game | null = null;

        if (ref.current) {
            game = StartGame(ref.current);
        }

        return () => {
            if (game) {
                game.destroy(true);
            }
        };
    }, [width]);

    return (
        <>
            {width < 500 && (
                <div className="alert">Please rotate your phone 📱</div>
            )}
            {width > 500 && <div ref={ref} id="app"></div>}
        </>
    );
}

export default App;

