import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import "../assets/style/style.css";

// ===============================
// 3 BILLS
// ===============================
const bills = [
  {
    id: "0128034399434",
    amount: "$99.99",
    date: "19 Aug 2026 · 20:17",
    status: "CONFIRMED",
    customer: "Usman Shams",
    card: "•••• 8237",
  },
  {
    id: "CF-84920418",
    amount: "$14.50",
    date: "20 Aug 2026 · 18:25",
    status: "SERVED",
    customer: "Usman Shams",
    card: "•••• 4192",
  },
  {
    id: "BK-72849105",
    amount: "$48.75",
    date: "21 Aug 2026 · 21:10",
    status: "PAID",
    customer: "Usman Shams",
    card: "•••• 6281",
  },
];

// ===============================
// SVG COFFEE
// ===============================
function CoffeeSVG() {
  return (
    <svg
      className="coffee-svg"
      viewBox="0 0 100 100"
    >
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="#fff4e6"
      />

      <path
        d="M29 43h38v16c0 11-8 18-19 18s-19-7-19-18V43Z"
        fill="none"
        stroke="#f39a28"
        strokeWidth="5"
      />

      <path
        d="M67 47h7c8 0 10 13 0 16h-7"
        fill="none"
        stroke="#f39a28"
        strokeWidth="5"
      />

      <path
        d="M39 32c-4-5 5-7 0-13"
        fill="none"
        stroke="#f39a28"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M50 32c-4-5 5-7 0-13"
        fill="none"
        stroke="#f39a28"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M61 32c-4-5 5-7 0-13"
        fill="none"
        stroke="#f39a28"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ===============================
// SVG BARCODE
// ===============================
function Barcode() {
  const bars = [
    2, 5, 2, 8, 3, 3, 7, 2, 5,
    3, 8, 2, 3, 6, 2, 7, 4, 2,
    5, 3, 8, 2, 4, 6, 2, 3,
    7, 2, 5, 3, 8, 2, 4, 6
  ];

  let x = 8;

  return (
    <svg
      className="barcode-svg"
      viewBox="0 0 330 80"
      preserveAspectRatio="none"
    >
      {bars.map((width, index) => {
        const currentX = x;
        x += width + 4;

        return (
          <rect
            key={index}
            x={currentX}
            y="5"
            width={width}
            height="50"
            fill="#111"
          />
        );
      })}
    </svg>
  );
}

// ===============================
// CONFETTI
// ===============================
function showConfetti() {
  const end = Date.now() + 1200;

  function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: {
        x: 0,
        y: 0.35,
      },
    });

    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: {
        x: 1,
        y: 0.35,
      },
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }

  frame();
}

// ===============================
// HOME
// ===============================
export default function Home() {
  const [billIndex, setBillIndex] = useState(0);

  const currentBill = bills[billIndex];

  // ===============================
  // NEXT BILL
  // ===============================
  const nextBill = () => {
    setBillIndex((prev) => {
      return (prev + 1) % bills.length;
    });

    setTimeout(() => {
      showConfetti();
    }, 700);
  };

  // ===============================
  // AUTO CHANGE
  // ===============================
  useEffect(() => {
    const timer = setInterval(() => {
      nextBill();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // ===============================
  // MANUAL CHANGE
  // ===============================
  const selectBill = (index) => {
    setBillIndex(index);

    setTimeout(() => {
      showConfetti();
    }, 700);
  };

  return (
    <div className="page">

      {/* BACKGROUND */}
      <div className="background" />

      <div className="dark-overlay" />

      {/* =================================
          RECEIPT MACHINE
      ================================= */}
      <div className="receipt-machine">

        {/* ORANGE STROKE / BAR */}
        <motion.div
          className="orange-stroke"

          initial={{
            scaleX: 0,
          }}

          animate={{
            scaleX: 1,
          }}

          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="stroke-light" />
        </motion.div>

        {/* =================================
            BILL COMES DOWN FROM BEHIND BAR
        ================================= */}
        <div className="bill-area">

          <AnimatePresence mode="wait">

            <motion.div
              key={currentBill.id}

              className="bill"

              // START ABOVE THE ORANGE BAR
              initial={{
                y: -500,
              }}

              // COME DOWN
              animate={{
                y: 0,
              }}

              // NEXT BILL GOES BACK UP
              exit={{
                y: -500,
              }}

              transition={{
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >

              {/* BILL TOP */}
              <div className="bill-top">

                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.65,
                  }}
                >
                  <span>TICKET ID</span>

                  <strong>
                    {currentBill.id}
                  </strong>
                </motion.div>

                <motion.div
                  className="amount-box"

                  initial={{
                    opacity: 0,
                  }}

                  animate={{
                    opacity: 1,
                  }}

                  transition={{
                    delay: 0.7,
                  }}
                >
                  <span>AMOUNT</span>

                  <strong>
                    {currentBill.amount}
                  </strong>
                </motion.div>

              </div>

              {/* DATE */}
              <div className="bill-row">

                <div>
                  <span>DATE & TIME</span>

                  <strong>
                    {currentBill.date}
                  </strong>
                </div>

                <div className="status-area">
                  <span>STATUS</span>

                  <b>
                    {currentBill.status}
                  </b>
                </div>

              </div>

              {/* CUSTOMER */}
              <motion.div
                className="customer"

                initial={{
                  opacity: 0,
                  y: 20,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}

                transition={{
                  delay: 0.75,
                }}
              >

                <div className="mastercard">
                  <i />
                  <i />
                </div>

                <div>
                  <strong>
                    {currentBill.customer}
                  </strong>

                  <small>
                    {currentBill.card}
                  </small>
                </div>

              </motion.div>

              {/* BARCODE */}
              <motion.div
                className="barcode-area"

                initial={{
                  opacity: 0,
                  scaleY: 0,
                }}

                animate={{
                  opacity: 1,
                  scaleY: 1,
                }}

                transition={{
                  delay: 0.8,
                  duration: 0.5,
                }}
              >
                <Barcode />

                <small>
                  4 8937261 273610
                </small>
              </motion.div>

            </motion.div>

          </AnimatePresence>

        </div>

        {/* ORANGE BAR ON TOP OF BILL */}
        <div className="orange-front" />

      </div>

      {/* =================================
          CONTROLS
      ================================= */}
      <div className="controls">

        {bills.map((bill, index) => (
          <button
            key={bill.id}
            onClick={() => selectBill(index)}
            className={
              index === billIndex
                ? "dot active"
                : "dot"
            }
          />
        ))}

      </div>

    </div>
  );
}