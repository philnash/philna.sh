import icon192 from "../assets/icon192x192.png";
import icon512 from "../assets/icon512x512.png";

export function GET() {
  return new Response(
    JSON.stringify(
      {
        name: "Phil Nash",
        short_name: "Phil Nash",
        start_url: "/",
        description: "Blog and personal site of Phil Nash.",
        dir: "ltr",
        lang: "en-GB",
        display: "minimal-ui",
        orientation: "any",
        background_color: "#fcfcfc",
        theme_color: "#ea0011",
        icons: [
          {
            src: icon192.src,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: icon512.src,
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      null,
      2
    )
  );
}
