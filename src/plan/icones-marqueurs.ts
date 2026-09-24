/**
 * Le tracé des icônes de marqueur, repris de lucide : une image exportée ne
 * peut pas contenir un composant React, il lui faut les formes brutes.
 * Chaque entrée est la liste des formes SVG de l'icône, sur une grille de 24.
 */
export type FormeIcone = [string, Record<string, string | number>]

export const DESSIN_ICONES: Record<string, FormeIcone[]> = {
  Flag: [
    [
      "path",
      {
        d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
        key: "1jaruq"
      }
    ]
  ],
  DoorOpen: [
    [
      "path",
      {
        d: "M10 21H2",
        key: "1sthdo"
      }
    ],
    [
      "path",
      {
        d: "M10 3H7a2 2 0 00-2 2v16",
        key: "15gt7x"
      }
    ],
    [
      "path",
      {
        d: "M14 12h.01",
        key: "1jfl7z"
      }
    ],
    [
      "path",
      {
        d: "M19 21V5a2 2 0 00-1.675-1.974l-6.163-1.013A1 1 0 0010 3v18a1 1 0 001.124.992z",
        key: "tyvg9a"
      }
    ],
    [
      "path",
      {
        d: "M22 21h-3",
        key: "1ec3tr"
      }
    ]
  ],
  Users: [
    [
      "path",
      {
        d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
        key: "1yyitq"
      }
    ],
    [
      "path",
      {
        d: "M16 3.128a4 4 0 0 1 0 7.744",
        key: "16gr8j"
      }
    ],
    [
      "path",
      {
        d: "M22 21v-2a4 4 0 0 0-3-3.87",
        key: "kshegd"
      }
    ],
    [
      "circle",
      {
        cx: "9",
        cy: "7",
        r: "4",
        key: "nufk8"
      }
    ]
  ],
  Target: [
    [
      "circle",
      {
        cx: "12",
        cy: "12",
        r: "10",
        key: "1mglay"
      }
    ],
    [
      "circle",
      {
        cx: "12",
        cy: "12",
        r: "6",
        key: "1vlfrh"
      }
    ],
    [
      "circle",
      {
        cx: "12",
        cy: "12",
        r: "2",
        key: "1c9p78"
      }
    ]
  ],
  Car: [
    [
      "path",
      {
        d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
        key: "5owen"
      }
    ],
    [
      "circle",
      {
        cx: "7",
        cy: "17",
        r: "2",
        key: "u2ysq9"
      }
    ],
    [
      "path",
      {
        d: "M9 17h6",
        key: "r8uit2"
      }
    ],
    [
      "circle",
      {
        cx: "17",
        cy: "17",
        r: "2",
        key: "axvx0g"
      }
    ]
  ],
  Construction: [
    [
      "rect",
      {
        x: "2",
        y: "6",
        width: "20",
        height: "8",
        rx: "1",
        key: "1estib"
      }
    ],
    [
      "path",
      {
        d: "M17 14v7",
        key: "7m2elx"
      }
    ],
    [
      "path",
      {
        d: "M7 14v7",
        key: "1cm7wv"
      }
    ],
    [
      "path",
      {
        d: "M17 3v3",
        key: "1v4jwn"
      }
    ],
    [
      "path",
      {
        d: "M7 3v3",
        key: "7o6guu"
      }
    ],
    [
      "path",
      {
        d: "M10 14 2.3 6.3",
        key: "1023jk"
      }
    ],
    [
      "path",
      {
        d: "m14 6 7.7 7.7",
        key: "1s8pl2"
      }
    ],
    [
      "path",
      {
        d: "m8 6 8 8",
        key: "hl96qh"
      }
    ]
  ],
  Plane: [
    [
      "path",
      {
        d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
        key: "1v9wt8"
      }
    ]
  ],
  UserRound: [
    [
      "circle",
      {
        cx: "12",
        cy: "8",
        r: "5",
        key: "1hypcn"
      }
    ],
    [
      "path",
      {
        d: "M20 21a8 8 0 0 0-16 0",
        key: "rfgkzh"
      }
    ]
  ],
  Crosshair: [
    [
      "circle",
      {
        cx: "12",
        cy: "12",
        r: "10",
        key: "1mglay"
      }
    ],
    [
      "line",
      {
        x1: "22",
        x2: "18",
        y1: "12",
        y2: "12",
        key: "l9bcsi"
      }
    ],
    [
      "line",
      {
        x1: "6",
        x2: "2",
        y1: "12",
        y2: "12",
        key: "13hhkx"
      }
    ],
    [
      "line",
      {
        x1: "12",
        x2: "12",
        y1: "6",
        y2: "2",
        key: "10w3f3"
      }
    ],
    [
      "line",
      {
        x1: "12",
        x2: "12",
        y1: "22",
        y2: "18",
        key: "15g9kq"
      }
    ]
  ],
  Eye: [
    [
      "path",
      {
        d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
        key: "1nclc0"
      }
    ],
    [
      "circle",
      {
        cx: "12",
        cy: "12",
        r: "3",
        key: "1v7zrd"
      }
    ]
  ],
  Hexagon: [
    [
      "path",
      {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
        key: "yt0hxn"
      }
    ]
  ],
  Ambulance: [
    [
      "path",
      {
        d: "M10 10H6",
        key: "1bsnug"
      }
    ],
    [
      "path",
      {
        d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
        key: "wrbu53"
      }
    ],
    [
      "path",
      {
        d: "M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14",
        key: "lrkjwd"
      }
    ],
    [
      "path",
      {
        d: "M8 8v4",
        key: "1fwk8c"
      }
    ],
    [
      "path",
      {
        d: "M9 18h6",
        key: "x1upvd"
      }
    ],
    [
      "circle",
      {
        cx: "17",
        cy: "18",
        r: "2",
        key: "332jqn"
      }
    ],
    [
      "circle",
      {
        cx: "7",
        cy: "18",
        r: "2",
        key: "19iecd"
      }
    ]
  ],
  MapPin: [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
        key: "1r0f0z"
      }
    ],
    [
      "circle",
      {
        cx: "12",
        cy: "10",
        r: "3",
        key: "ilqhr7"
      }
    ]
  ]
}
