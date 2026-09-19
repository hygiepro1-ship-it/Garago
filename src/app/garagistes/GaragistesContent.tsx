"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

const SIGNUP = "/inscription/garage";

// Les écrans montrés (calendrier, onglet Services, carte de rendez-vous) sont
// des reproductions du tableau de bord garage : mêmes couleurs, formes et textes.
const COPY = {
  fr: {
    eyebrow: "Pour les garagistes du Québec",
    h1a: "Fini les rendez-vous",
    h1b: "pris au téléphone.",
    lead: "Vos clients réservent eux-mêmes en ligne, selon vos heures d'ouverture et la durée de chaque service. Chaque rendez-vous arrive dans votre tableau de bord.",
    cta: "Commencer — 30 jours gratuits",
    seeSteps: "Voir les étapes ↓",
    fine: "Carte requise · aucun prélèvement avant 30 jours",
    phone: {
      aria: "Calendrier du garage, exemple",
      title: "Calendrier", today: "Auj.", date: "jeudi 24 septembre", todayTag: "Aujourd'hui",
      count: "rendez-vous", confirmed: "Confirmé", online: "En ligne", newAppt: "+ Nouveau rendez-vous",
      appts: [
        { s: "08:00", e: "08:30", n: "Marie Tremblay", v: "2021 Honda Civic · Vidange d'huile", on: true },
        { s: "08:00", e: "09:30", n: "Paul Gagnon", v: "2019 Chevrolet Silverado · Freins", on: true },
        { s: "08:00", e: "08:30", n: "Sophie Roy", v: "2018 Hyundai Elantra · Vidange d'huile", on: false },
        { s: "08:30", e: "09:30", n: "Karim Benali", v: "2020 Toyota RAV4 · Pneus d'hiver", on: true },
      ],
    },
    featuresTitle: "Un calendrier qui s'adapte à votre atelier",
    f1: { t: "Chaque service a sa durée.", p: "Vous réglez le temps de chaque prestation. Garago bloque exactement cette durée dans votre calendrier." },
    f2: { t: "Plusieurs véhicules en même temps.", p: "Indiquez combien de postes compte votre garage. Un créneau n'est complet que lorsque tous sont occupés." },
    f3: { t: "Vous savez qui arrive.", p: "Chaque réservation arrive confirmée, avec le véhicule, le service et le mot du client." },
    dash: {
      title: "Services", sub: "Cochez les services que vous offrez", save: "Enregistrer",
      oil: "Vidange d'huile", brakes: "Freins", duration: "Durée", h: "h", min: "min",
      capLabel: "Véhicules pris en charge en même temps", capUnit: "postes de travail",
      capHelp: "Nombre de postes ou d'employés pouvant chacun s'occuper d'un véhicule en même temps. Un même créneau n'est complet que lorsque tous vos postes sont occupés.",
    },
    card: {
      vehicle: "Véhicule", note: "Bruit de frottement en freinant, surtout à basse vitesse.",
      done: "Terminer", move: "Déplacer", cancel: "Annuler",
    },
    steps: {
      title: "De l'inscription à votre premier rendez-vous",
      lead: "Cinq étapes. Vous savez toujours où vous en êtes et ce qui vient ensuite.",
      list: [
        { t: "Créez votre compte et votre garage", p: "Votre nom, le nom du garage, son adresse et son numéro d'entreprise du Québec (NEQ).", tag: "Ayez votre NEQ à portée de main", green: false },
        { t: "Choisissez vos services et vos marques", p: "Cochez ce que vous faites et les véhicules que vous traitez. Vous pourrez tout modifier plus tard." },
        { t: "Choisissez votre formule et ajoutez une carte", p: "Mensuel ou annuel. La carte active votre essai de 30 jours.", tag: "Rien n'est prélevé pendant 30 jours", green: true },
        { t: "Réglez votre tableau de bord", p: "Vos heures d'ouverture, la durée de chaque service et le nombre de véhicules en même temps." },
        { t: "Nous vérifions votre NEQ, puis vous êtes en ligne", p: "Notre équipe confirme votre entreprise avant de publier votre garage. Ensuite, les conducteurs peuvent réserver." },
      ],
      cta: "Commencer", fine: "Annulable à tout moment avant la fin de l'essai",
    },
    price: {
      title: "Un seul abonnement, deux façons de payer",
      sub: "Tout est inclus dans les deux. Seule la facturation change.",
      unit: "$ / mois", cta: "Commencer",
      monthly: { name: "Mensuel", amount: "109,99", bullets: ["Sans engagement", "Résiliez quand vous voulez, en un clic", "Facturé chaque mois"] },
      annual: { name: "Annuel", badge: "Économisez 20 %", amount: "88,00", total: "soit 1 056,00 $ par année", bullets: ["Environ 264 $ d'économie par année", "Un seul paiement par année", "Tarif garanti pendant 12 mois"] },
      trialBold: "30 jours gratuits", trialRest: " avec les deux formules · carte requise · rien n'est prélevé avant la fin de l'essai",
      inclTitle: "Tout est inclus",
      incl: [
        "Prise de rendez-vous en ligne 24 h sur 24",
        "Ajoutez, déplacez ou annulez un rendez-vous en quelques clics, depuis votre téléphone",
        "Vos clients reçoivent leur confirmation par courriel, sans que vous ayez à les rappeler",
      ],
      extra: "Garage additionnel : +49,99 $/mois, sur le même abonnement.",
    },
    faqTitle: "Questions fréquentes",
    faq: [
      ["Une carte est-elle requise pour l'essai ?", "Oui, pour activer l'essai de 30 jours. Rien n'est prélevé avant la fin de la période."],
      ["Que se passe-t-il à la fin des 30 jours ?", "Votre abonnement démarre automatiquement avec la carte fournie. Si vous ne souhaitez pas continuer, annulez avant cette date depuis votre tableau de bord, sans frais."],
      ["Puis-je annuler à tout moment ?", "Oui, en un clic depuis votre tableau de bord, sans engagement. Votre garage reste actif jusqu'à la fin de la période payée."],
      ["Pourquoi mon NEQ, et quand mon garage devient-il visible ?", "Notre équipe vérifie chaque numéro d'entreprise avant de publier un garage : c'est ce qui garantit aux conducteurs qu'ils réservent auprès de vrais garages. Votre profil apparaît dans les résultats dès cette vérification faite."],
      ["Comment Garago sait-il combien de temps bloquer pour un service ?", "C'est vous qui le décidez : chaque service a sa durée dans votre tableau de bord (onglet Services). Une vidange de 30 minutes et des freins de 90 minutes ne bloquent pas le même temps."],
      ["J'ai plusieurs employés qui travaillent en même temps.", "Indiquez combien de véhicules votre garage prend en charge simultanément (onglet Services). Un créneau n'est complet que lorsque tous vos postes sont occupés."],
      ["Puis-je ajouter un client qui a appelé, fermer des journées ou déplacer un rendez-vous ?", "Oui, depuis votre tableau de bord. Le client est averti par courriel quand vous déplacez son rendez-vous."],
      ["Puis-je gérer mon tableau de bord depuis mon téléphone ?", "Oui. Il s'ouvre dans le navigateur de votre téléphone, sans application à installer."],
      ["J'ai plusieurs garages.", "Un seul abonnement couvre tous vos garages : 109,99 $/mois pour le premier, +49,99 $/mois par garage supplémentaire. Chacun garde son profil, ses horaires et son calendrier."],
      ["Comment les conducteurs me trouvent-ils ?", "Ils cherchent par service, par marque et modèle de véhicule, et par position. Les résultats sont classés du plus proche au plus éloigné, puis par disponibilité."],
      ["Que faire si je reçois un avis négatif ?", "Les avis viennent de vrais comptes conducteurs. Vous pouvez répondre publiquement à chacun depuis votre tableau de bord."],
      ["Les conducteurs paient-ils quelque chose ?", "Non. Garago est gratuit pour les conducteurs."],
    ],
    finalTitle: "Prêt à remplir votre calendrier ?",
  },
  en: {
    eyebrow: "For Quebec garage owners",
    h1a: "No more booking",
    h1b: "appointments by phone.",
    lead: "Your customers book online themselves, within your opening hours and the real length of each service. Every appointment lands in your dashboard.",
    cta: "Get started — 30 days free",
    seeSteps: "See the steps ↓",
    fine: "Card required · no charge for 30 days",
    phone: {
      aria: "Garage calendar, example",
      title: "Calendar", today: "Today", date: "Thursday, September 24", todayTag: "Today",
      count: "appointments", confirmed: "Confirmed", online: "Online", newAppt: "+ New appointment",
      appts: [
        { s: "08:00", e: "08:30", n: "Marie Tremblay", v: "2021 Honda Civic · Oil change", on: true },
        { s: "08:00", e: "09:30", n: "Paul Gagnon", v: "2019 Chevrolet Silverado · Brakes", on: true },
        { s: "08:00", e: "08:30", n: "Sophie Roy", v: "2018 Hyundai Elantra · Oil change", on: false },
        { s: "08:30", e: "09:30", n: "Karim Benali", v: "2020 Toyota RAV4 · Winter tires", on: true },
      ],
    },
    featuresTitle: "A calendar that fits your shop",
    f1: { t: "Every service has its own length.", p: "You set the time each service takes. Garago blocks exactly that long in your calendar." },
    f2: { t: "Several vehicles at once.", p: "Tell us how many bays your garage has. A slot is only full when every bay is busy." },
    f3: { t: "You know who's coming.", p: "Every booking arrives confirmed, with the vehicle, the service and the customer's note." },
    dash: {
      title: "Services", sub: "Tick the services you offer", save: "Save",
      oil: "Oil change", brakes: "Brakes", duration: "Duration", h: "h", min: "min",
      capLabel: "Vehicles handled at the same time", capUnit: "work bays",
      capHelp: "Number of bays or employees who can each work on a vehicle at the same time. A time slot is only full when all your bays are busy.",
    },
    card: {
      vehicle: "Vehicle", note: "Grinding noise when braking, mostly at low speed.",
      done: "Complete", move: "Reschedule", cancel: "Cancel",
    },
    steps: {
      title: "From sign-up to your first appointment",
      lead: "Five steps. You always know where you are and what comes next.",
      list: [
        { t: "Create your account and your garage", p: "Your name, the garage name, its address and its Quebec business number (NEQ).", tag: "Have your NEQ handy", green: false },
        { t: "Choose your services and brands", p: "Tick what you do and the vehicles you work on. You can change everything later." },
        { t: "Choose your plan and add a card", p: "Monthly or annual. The card activates your 30-day trial.", tag: "Nothing is charged for 30 days", green: true },
        { t: "Set up your dashboard", p: "Your opening hours, the length of each service and how many vehicles you handle at once." },
        { t: "We check your NEQ, then you're live", p: "Our team confirms your business before publishing your garage. After that, drivers can book." },
      ],
      cta: "Get started", fine: "Cancel any time before the trial ends",
    },
    price: {
      title: "One subscription, two ways to pay",
      sub: "Everything is included in both. Only the billing changes.",
      unit: "$ / month", cta: "Get started",
      monthly: { name: "Monthly", amount: "109.99", bullets: ["No commitment", "Cancel any time, in one click", "Billed every month"] },
      annual: { name: "Annual", badge: "Save 20%", amount: "88.00", total: "that's $1,056.00 per year", bullets: ["About $264 saved per year", "One payment per year", "Price locked for 12 months"] },
      trialBold: "30 days free", trialRest: " with both plans · card required · nothing is charged until the trial ends",
      inclTitle: "Everything is included",
      incl: [
        "Online booking, 24 hours a day",
        "Add, move or cancel an appointment in a few clicks, from your phone",
        "Your customers get their confirmation by email — no need to call them back",
      ],
      extra: "Additional garage: +$49.99/month, on the same subscription.",
    },
    faqTitle: "Frequently asked questions",
    faq: [
      ["Is a card required for the trial?", "Yes, to activate the 30-day trial. Nothing is charged before the end of the period."],
      ["What happens after the 30 days?", "Your subscription starts automatically with the card you provided. If you don't want to continue, cancel before that date from your dashboard, at no cost."],
      ["Can I cancel at any time?", "Yes, in one click from your dashboard, with no commitment. Your garage stays active until the end of the paid period."],
      ["Why do you ask for my NEQ, and when does my garage become visible?", "Our team checks every business number before a garage is published: it guarantees drivers they are booking with real garages. Your profile appears in the results as soon as that check is done."],
      ["How does Garago know how long to block for a service?", "You decide: each service has its own length in your dashboard (Services tab). A 30-minute oil change and a 90-minute brake job don't block the same time."],
      ["I have several employees working at the same time.", "Set how many vehicles your garage handles at once (Services tab). A slot is only full when all your bays are busy."],
      ["Can I add a customer who called, close some days or move an appointment?", "Yes, from your dashboard. The customer is notified by email when you move their appointment."],
      ["Can I manage my dashboard from my phone?", "Yes. It opens in your phone's browser, with no app to install."],
      ["I have several garages.", "One subscription covers all your garages: $109.99/month for the first one, +$49.99/month per additional garage. Each keeps its own profile, hours and calendar."],
      ["How do drivers find me?", "They search by service, by vehicle make and model, and by location. Results are ranked from closest to farthest, then by availability."],
      ["What if I get a bad review?", "Reviews come from real driver accounts. You can reply publicly to each one from your dashboard."],
      ["Do drivers pay anything?", "No. Garago is free for drivers."],
    ],
    finalTitle: "Ready to fill your calendar?",
  },
} as const;

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);

function ApptRow({ a, confirmed, online, chevronUp }: {
  a: { s: string; e: string; n: string; v: string; on: boolean };
  confirmed: string; online: string; chevronUp?: boolean;
}) {
  return (
    <div className="appt">
      <div className="t tnum"><b>{a.s}</b><small>{a.e}</small></div>
      <div className="info">
        <div className="name-row">
          <span className="name">{a.n}</span>
          <span className="pill ok">{confirmed}</span>
          {a.on && <span className="pill on">{online}</span>}
        </div>
        <p className="sub">{a.v}</p>
      </div>
      <span className="chev" style={chevronUp ? { transform: "rotate(180deg)" } : undefined}>▾</span>
    </div>
  );
}

export default function GaragistesContent() {
  const { lang } = useLang();
  const c = COPY[lang === "en" ? "en" : "fr"];
  const ph = c.phone;

  return (
    <div className="gp">
      {/* ═════ HERO ═════ */}
      <div className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">{c.eyebrow}</p>
              <h1>{c.h1a}<br /><em>{c.h1b}</em></h1>
              <p className="lead">{c.lead}</p>
              <Link className="btn btn-primary" href={SIGNUP}>{c.cta}</Link>
              <a className="link" href="#etapes">{c.seeSteps}</a>
              <p className="fine">{c.fine}</p>
            </div>

            <div className="phone" aria-label={ph.aria}>
              <div className="ag-head">
                <div className="ag-top"><span className="sq">‹</span><span className="ag-title">{ph.title}</span><span className="today-btn">{ph.today}</span></div>
                <div className="ag-date"><span className="sq">‹</span><div className="mid"><p>{ph.date}</p><span>{ph.todayTag}</span></div><span className="sq">›</span></div>
                <div className="ag-count"><b>{ph.appts.length}</b>{ph.count}</div>
              </div>
              <div className="ag-list">
                {ph.appts.map((a) => (
                  <div className="card" key={a.n}><ApptRow a={a} confirmed={ph.confirmed} online={ph.online} /></div>
                ))}
              </div>
              <div className="fab">{ph.newAppt}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════ 3 ARGUMENTS ═════ */}
      <section>
        <div className="wrap">
          <h2 className="sec-title">{c.featuresTitle}</h2>

          <div className="feature">
            <div><h3>{c.f1.t}</h3><p>{c.f1.p}</p></div>
            <div className="vis">
              <div className="dash">
                <div className="dash-head"><div><h4>{c.dash.title}</h4><p>{c.dash.sub}</p></div><span className="save">{c.dash.save}</span></div>
                <div className="svc-grid">
                  <div className="svc">
                    <div className="svc-top"><span className="cb">{CHECK}</span>
                      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>{c.dash.oil}</div>
                    <span className="lbl">{c.dash.duration}</span>
                    <div className="dur-in"><div className="input tnum">0</div><em>{c.dash.h}</em><div className="input tnum">30</div><em>{c.dash.min}</em></div>
                  </div>
                  <div className="svc">
                    <div className="svc-top"><span className="cb">{CHECK}</span>
                      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.22" y1="4.22" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.78" y2="19.78" /><line x1="4.22" y1="19.78" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.78" y2="4.22" /></svg>{c.dash.brakes}</div>
                    <span className="lbl">{c.dash.duration}</span>
                    <div className="dur-in"><div className="input tnum">1</div><em>{c.dash.h}</em><div className="input tnum">30</div><em>{c.dash.min}</em></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature flip">
            <div><h3>{c.f2.t}</h3><p>{c.f2.p}</p></div>
            <div className="vis">
              <div className="dash">
                <div className="dash-head"><div><h4>{c.dash.title}</h4><p>{c.dash.sub}</p></div><span className="save">{c.dash.save}</span></div>
                <div className="capbox">
                  <span className="field-label">{c.dash.capLabel}</span>
                  <div className="cap-row"><div className="input tnum" style={{ width: "7rem" }}>3</div><span className="cap-unit">{c.dash.capUnit}</span></div>
                  <p className="help">{c.dash.capHelp}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="feature">
            <div><h3>{c.f3.t}</h3><p>{c.f3.p}</p></div>
            <div className="vis">
              <div className="stack">
                <div className="card open">
                  <ApptRow a={ph.appts[1]} confirmed={ph.confirmed} online={ph.online} chevronUp />
                  <div className="expanded">
                    <div className="vbox"><p>{c.card.vehicle}</p><strong>2019 Chevrolet Silverado</strong></div>
                    <div className="chips"><span className="chip tel">📞 (514) 555-0142</span><span className="chip mail">✉️ paul.g@exemple.com</span></div>
                    <p className="note">📝 {c.card.note}</p>
                    <div className="acts">
                      <span className="act" style={{ background: "#16a34a" }}>✅ {c.card.done}</span>
                      <span className="act" style={{ background: "#7c3aed" }}>📅 {c.card.move}</span>
                      <span className="act" style={{ background: "#ef4444" }}>{c.card.cancel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ PARCOURS GUIDÉ ═════ */}
      <section className="steps-sec" id="etapes">
        <div className="wrap">
          <h2 className="sec-title">{c.steps.title}</h2>
          <p className="steps-lead">{c.steps.lead}</p>
          <ol className="steps">
            {c.steps.list.map((s, i) => {
              const last = i === c.steps.list.length - 1;
              const tag = "tag" in s ? s.tag : undefined;
              const green = "green" in s ? s.green : false;
              return (
                <li className={`step${last ? " done" : ""}`} key={s.t}>
                  <span className="num">{last ? "✓" : i + 1}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.p}</p>
                    {tag && <span className={`tag${green ? " green" : ""}`}>{tag}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="steps-cta">
            <Link className="btn btn-primary" href={SIGNUP}>{c.steps.cta}</Link>
            <p className="fine">{c.steps.fine}</p>
          </div>
        </div>
      </section>

      {/* ═════ TARIF ═════ */}
      <section className="pricing" id="tarif">
        <div className="wrap">
          <h2 className="sec-title" style={{ marginBottom: 14 }}>{c.price.title}</h2>
          <p className="price-sub">{c.price.sub}</p>

          <div className="plans">
            <div className="plan">
              <p className="plan-name">{c.price.monthly.name}</p>
              <div className="amount"><strong className="tnum">{c.price.monthly.amount}</strong><span>{c.price.unit}</span></div>
              <ul className="diff">{c.price.monthly.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              <Link className="btn btn-primary" href={SIGNUP}>{c.price.cta}</Link>
            </div>
            <div className="plan alt">
              <span className="badge">{c.price.annual.badge}</span>
              <p className="plan-name">{c.price.annual.name}</p>
              <div className="amount"><strong className="tnum">{c.price.annual.amount}</strong><span>{c.price.unit}</span></div>
              <p className="total">{c.price.annual.total}</p>
              <ul className="diff">{c.price.annual.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              <Link className="btn btn-dark" href={SIGNUP}>{c.price.cta}</Link>
            </div>
          </div>
          <p className="trial-line"><b>{c.price.trialBold}</b>{c.price.trialRest}</p>

          <div className="incl">
            <h3>{c.price.inclTitle}</h3>
            <ul>{c.price.incl.map((b) => <li key={b}>{b}</li>)}</ul>
            <p className="extra">{c.price.extra}</p>
          </div>
        </div>
      </section>

      {/* ═════ FAQ ═════ */}
      <section>
        <div className="wrap">
          <h2 className="sec-title">{c.faqTitle}</h2>
          <div className="faq-list">
            {c.faq.map(([q, a], i) => (
              <details key={q} open={i === 0 ? true : undefined}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final">
        <div className="wrap">
          <h2>{c.finalTitle}</h2>
          <Link className="btn btn-primary" href={SIGNUP}>{c.cta}</Link>
          <p className="fine">{c.fine}</p>
        </div>
      </section>
    </div>
  );
}
