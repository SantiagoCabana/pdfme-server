type SummaryCard = {
  label: string;
  value: string;
  note: string;
};

type OverviewCardsProps = {
  cards: SummaryCard[];
};

export function OverviewCards({ cards }: OverviewCardsProps) {
  return (
    <section className="statGrid">
      {cards.map((card) => (
        <article className="statCard" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <p>{card.note}</p>
        </article>
      ))}
    </section>
  );
}
