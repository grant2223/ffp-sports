import { Shell } from "./Static";

export function Legal({ kind }: { kind: "terms" | "privacy" }) {
  return (
    <Shell>
      <div className="bf" style={{ maxWidth: 760 }}>
        {kind === "terms" ? <>
          <h1>Booking terms</h1>
          <div className="okp" style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7, color: "#344054" }}>
            <p>FFP Sports is a service of FIND FIT PEOPLE L.L.C-FZ, Dubai, United Arab Emirates.</p>
            <h2 className="sh" style={{ marginTop: 24 }}>Prices and payment</h2>
            <p>Prices are in AED and shown before you book. Your price is fixed once we confirm your booking. Payment is in advance by bank transfer. Over AED 10,000, pay 50% to book and the rest before the work starts. Your booking is secured when payment is received.</p>
            <h2 className="sh" style={{ marginTop: 24 }}>Changes and cancellations</h2>
            <p>Change your date free of charge up to 7 days before. Cancel more than 7 days before for a full refund, 2 to 7 days before for a 50% refund. Less than 48 hours before, there is no refund. Extra time on the day is charged at the extra hour rate.</p>
            <h2 className="sh" style={{ marginTop: 24 }}>Gear rental</h2>
            <p>Gear rental is paid in full in advance. There is no deposit: you leave your Emirates ID with us at pick-up or delivery, and we hand it back when the gear is returned. You pay the repair cost of anything damaged while the gear is with you, or the replacement cost if it is lost or can't be repaired. You are responsible for the gear from pick-up until it is returned.</p>
            <h2 className="sh" style={{ marginTop: 24 }}>At the venue</h2>
            <p>You arrange venue access, permissions to film and stream, and a power point near the camera position.</p>
            <h2 className="sh" style={{ marginTop: 24 }}>Your footage</h2>
            <p>Recordings, footage and photos are yours to use. We may show short clips in our own portfolio unless you ask us not to.</p>
          </div>
        </> : <>
          <h1>Privacy</h1>
          <div className="okp" style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7, color: "#344054" }}>
            <p>We collect the details you give us when you book or ask for an estimate: your name, organisation, email, mobile and event details.</p>
            <p>We use them to check availability, confirm and deliver your booking, take payment and contact you about it. We don't sell your details.</p>
            <p>To see, correct or delete your details, email info@findfitpeople.com.</p>
          </div>
        </>}
      </div>
    </Shell>
  );
}
