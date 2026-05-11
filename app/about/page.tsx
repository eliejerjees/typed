import Link from "next/link";

export default function AboutPage() {
    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#c026d3",
                color: "#fff",
                padding: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Link
                href="/"
                style={{
                    position: "fixed",
                    top: 24,
                    right: 28,
                    zIndex: 300,
                    color: "rgba(255,255,255,0.8)",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    letterSpacing: "0.04em",
                }}
            >
                Home
            </Link>

            <section
                style={{
                    width: "100%",
                    maxWidth: "900px",
                    background: "rgba(0,0,0,0.22)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "28px",
                    padding: "40px",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
                }}
            >
                <p
                    style={{
                        marginTop: 0,
                        marginBottom: "12px",
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.65)",
                    }}
                >
                    About Typed
                </p>

                <h1
                    style={{
                        margin: 0,
                        fontSize: "clamp(3rem, 9vw, 6.5rem)",
                        lineHeight: 0.9,
                        fontWeight: 1000,
                        letterSpacing: "-0.08em",
                    }}
                >
                    What is Typed?
                </h1>

                <p
                    style={{
                        marginTop: "28px",
                        fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.84)",
                        maxWidth: "760px",
                        fontWeight: 600,
                    }}
                >
                    Typed is a mix between personality tests like MBTI and BuzzFeed quizzes,
                    and interactive data experiences like Spotify Wrapped. I made it because
                    most personality tests feel too long, repetitive, and predictable.
                </p>

                <p
                    style={{
                        marginTop: "18px",
                        fontSize: "1.05rem",
                        lineHeight: 1.7,
                        color: "rgba(255,255,255,0.72)",
                        maxWidth: "760px",
                        fontWeight: 500,
                    }}
                >
                    Instead of asking direct personality questions, Typed experiments with a
                    new question: can your media preferences say something about your
                    personality? The experience uses music, movies, shows, artists, actors,
                    and head-to-head choices to build a profile based on what you actually
                    like. The hypothesis is people who have very similar interests in media will have similar personality traits.
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                        marginTop: "36px",
                    }}
                >
                    <div style={cardStyle}>
                        <h2 style={cardTitle}>The Problem</h2>
                        <p style={cardText}>
                            Traditional tests can feel boring because they ask obvious questions
                            and repeat the same patterns. They also may not understand what you like.
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <h2 style={cardTitle}>The Experiment</h2>
                        <p style={cardText}>
                            Typed turns the test into a game by using taste-based choices on movies, TV shows, and musicinstead
                            of standard personality prompts.
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <h2 style={cardTitle}>The Result</h2>
                        <p style={cardText}>
                            An AI model uses your choices to categorize your type and generate a personalized
                            result based on your actual preferences and behavior.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "20px",
    padding: "22px",
};

const cardTitle: React.CSSProperties = {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 900,
};

const cardText: React.CSSProperties = {
    marginTop: "10px",
    marginBottom: 0,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.5,
    fontWeight: 500,
};