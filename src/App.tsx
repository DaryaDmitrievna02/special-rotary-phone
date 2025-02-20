import { useRef, useLayoutEffect } from "react";
import StartGame from "./game/main";

function App() {
    const ref = useRef(null);

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
    }, []);

    return <div ref={ref} id="app"></div>;
}

export default App;

