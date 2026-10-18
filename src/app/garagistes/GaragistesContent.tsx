"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import PresentationVideo from "./PresentationVideo";

const SIGNUP = "/inscription/garage";

// En haut, la vidéo de présentation dans la langue de la page.
const COPY = {
  fr: {
    kicker: "Prise de rendez-vous en ligne pour garage",
    h1a: "Fini les rendez-vous",
    h1b: "pris au téléphone.",
    lead: "Vos clients réservent eux-mêmes en ligne, selon vos heures d'ouverture et la durée de chaque service. Chaque rendez-vous arrive dans votre tableau de bord.",
    cta: "Essayer 30 jours gratuitement",
    seeSteps: "Voir les étapes",
    shots: {
      title: "Garago en images",
      list: [
        { src: "/images/guides/agenda-garago-fr.webp", w: 2240, h: 1220, alt: "Agenda de la semaine dans Garago pour un garage à deux portes : rendez-vous confirmés en vert, à confirmer en orange, à appeler en rouge", cap: "Votre agenda : chaque rendez-vous réservé en ligne y arrive, avec son état de confirmation." },
        { src: "/images/guides/texto-confirmation-fr.webp", w: 1800, h: 1240, alt: "Texto de Garago au nom du Garage Lavoie : rendez-vous le vendredi 16 octobre à 9 h, avec un lien pour confirmer ou annuler", cap: "La demande de confirmation envoyée au client à votre nom, deux jours avant." },
      ],
    },
    fine: "Carte requise · aucun prélèvement avant 30 jours",
    steps: {
      title: "De l'inscription à votre premier rendez-vous",
      needLabel: "À prévoir",
      list: [
        { t: "Créez votre compte et votre garage", p: "Votre nom, le nom du garage, son adresse et son numéro d'entreprise du Québec (NEQ).", need: "Votre NEQ." },
        { t: "Choisissez vos services et vos marques", p: "Cochez ce que vous faites et les véhicules que vous traitez. Vous pourrez tout modifier plus tard." },
        { t: "Choisissez votre formule et ajoutez une carte", p: "Mensuel ou annuel. La carte active votre essai de 30 jours.", need: "Une carte. Rien n'est prélevé pendant 30 jours." },
        { t: "Réglez votre tableau de bord", p: "Vos heures d'ouverture, la durée de chaque service et le nombre de véhicules en même temps." },
        { t: "Nous vérifions votre NEQ, puis vous êtes en ligne", p: "Notre équipe confirme votre entreprise avant de publier votre garage. Ensuite, les conducteurs peuvent réserver.", need: "Rien. Notre équipe s'en occupe." },
      ],
      cta: "Commencer", fine: "Annulable à tout moment avant la fin de l'essai",
    },
    price: {
      title: "Un seul abonnement, deux façons de payer",
      sub: "Tout est inclus dans les deux. Seule la facturation change.",
      unit: "$ / mois", cta: "Commencer",
      monthly: { name: "Mensuel", amount: "109,99", bullets: ["Sans engagement", "Résiliez quand vous voulez, en un clic", "Facturé chaque mois"] },
      annual: { name: "Annuel", badge: "Économisez 20 %", amount: "88,00", total: "soit 1 055,90 $ par année", bullets: ["Environ 264 $ d'économie par année", "Un seul paiement par année", "Tarif garanti pendant 12 mois"] },
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
      ["J'ai plusieurs employés qui travaillent en même temps.", "Indiquez combien de véhicules votre garage prend en charge simultanément (onglet Services). Un créneau n'est complet que lorsque toutes vos portes sont occupées."],
      ["Puis-je ajouter un client qui a appelé, fermer des journées ou déplacer un rendez-vous ?", "Oui, depuis votre tableau de bord. Le client est averti par courriel quand vous déplacez son rendez-vous."],
      ["Puis-je gérer mon tableau de bord depuis mon téléphone ?", "Oui. Il s'ouvre dans le navigateur de votre téléphone, sans application à installer."],
      ["J'ai plusieurs garages.", "Un seul abonnement couvre tous vos garages : 109,99 $/mois pour le premier, +49,99 $/mois par garage supplémentaire. Chacun garde son profil, ses horaires et son calendrier."],
      ["Comment les conducteurs me trouvent-ils ?", "Ils cherchent par service, par marque et modèle de véhicule, et par position. Les résultats sont classés du plus proche au plus éloigné, puis par disponibilité."],
      ["Que faire si je reçois un avis négatif ?", "Les avis viennent de vrais comptes conducteurs. Vous pouvez répondre publiquement à chacun depuis votre tableau de bord."],
      ["Les conducteurs paient-ils quelque chose ?", "Non. Garago est gratuit pour les conducteurs."],
    ],
  },
  en: {
    kicker: "Online booking for auto repair shops",
    h1a: "No more booking",
    h1b: "appointments by phone.",
    lead: "Your customers book online themselves, within your opening hours and the real length of each service. Every appointment lands in your dashboard.",
    cta: "Try it free for 30 days",
    seeSteps: "See the steps",
    shots: {
      title: "Garago in pictures",
      list: [
        { src: "/images/guides/agenda-garago-en.webp", w: 2240, h: 1220, alt: "Weekly calendar in Garago for a two-bay shop: confirmed appointments in green, to confirm in orange, to call in red", cap: "Your calendar: every online booking lands here, with its confirmation status." },
        { src: "/images/guides/texto-confirmation-en.webp", w: 1800, h: 1240, alt: "Garago text message in Lavoie Garage's name: appointment Friday, October 16 at 9 AM, with a link to confirm or cancel", cap: "The confirmation request sent to the customer in your name, two days ahead." },
      ],
    },
    fine: "Card required · no charge for 30 days",
    steps: {
      title: "From sign-up to your first appointment",
      needLabel: "What you need",
      list: [
        { t: "Create your account and your garage", p: "Your name, the garage name, its address and its Quebec business number (NEQ).", need: "Your NEQ." },
        { t: "Choose your services and brands", p: "Tick what you do and the vehicles you work on. You can change everything later." },
        { t: "Choose your plan and add a card", p: "Monthly or annual. The card activates your 30-day trial.", need: "A card. Nothing is charged for 30 days." },
        { t: "Set up your dashboard", p: "Your opening hours, the length of each service and how many vehicles you handle at once." },
        { t: "We check your NEQ, then you're live", p: "Our team confirms your business before publishing your garage. After that, drivers can book.", need: "Nothing. Our team takes care of it." },
      ],
      cta: "Get started", fine: "Cancel any time before the trial ends",
    },
    price: {
      title: "One subscription, two ways to pay",
      sub: "Everything is included in both. Only the billing changes.",
      unit: "$ / month", cta: "Get started",
      monthly: { name: "Monthly", amount: "109.99", bullets: ["No commitment", "Cancel any time, in one click", "Billed every month"] },
      annual: { name: "Annual", badge: "Save 20%", amount: "88.00", total: "that's $1,055.90 per year", bullets: ["About $264 saved per year", "One payment per year", "Price locked for 12 months"] },
      trialBold: "30 days free", trialRest: " with both plans · card required · nothing is charged until the trial ends",
      inclTitle: "Everything is included",
      incl: [
        "Online booking, 24 hours a day",
        "Add, move or cancel an appointment in a few clicks, from your phone",
        "Your customers get their confirmation by email, so you don't have to call them back",
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
  },
} as const;

export default function GaragistesContent() {
  const { lang } = useLang();
  const c = COPY[lang === "en" ? "en" : "fr"];

  return (
    <div className="gp">
      {/* ═════ HERO ═════ */}
      <div className="hero">
        <div className="wrap">
          <div style={{ maxWidth: 640 }}>
            {/* Ligne de mots-clés : cette page est la page de référence pour « prise de rendez-vous en ligne garage » */}
            <p className="kicker">{c.kicker}</p>
            <h1>{c.h1a}<br /><em>{c.h1b}</em></h1>
            <p className="lead">{c.lead}</p>
            <Link className="btn btn-primary" href={SIGNUP}>{c.cta}</Link>
            <a className="link" href="#etapes">{c.seeSteps}</a>
            <p className="fine">{c.fine}</p>
          </div>

          <PresentationVideo lang={lang === "en" ? "en" : "fr"} />
        </div>
      </div>

      {/* ═════ PARCOURS GUIDÉ ═════ */}
      <section className="steps-sec" id="etapes">
        <div className="wrap">
          <h2 className="sec-title">{c.steps.title}</h2>
          <ol className="steps">
            {c.steps.list.map((s, i) => {
              const need = "need" in s ? s.need : undefined;
              return (
                <li className="step" key={s.t}>
                  <span className="num" aria-hidden="true">{i + 1}</span>
                  <div className="what">
                    <h3>{s.t}</h3>
                    <p>{s.p}</p>
                  </div>
                  {need && (
                    <p className="need">
                      <span>{c.steps.needLabel}</span>
                      {need}
                    </p>
                  )}
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

      {/* ═════ EN IMAGES ═════ */}
      <section className="shots-sec">
        <div className="wrap">
          <h2 className="sec-title">{c.shots.title}</h2>
          <div className="shots">
            {c.shots.list.map((s) => (
              <figure key={s.src}>
                {/* eslint-disable-next-line @next/next/no-img-element -- capture statique déjà optimisée (webp) */}
                <img src={s.src} alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async" />
                <figcaption>{s.cap}</figcaption>
              </figure>
            ))}
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
    </div>
  );
}
