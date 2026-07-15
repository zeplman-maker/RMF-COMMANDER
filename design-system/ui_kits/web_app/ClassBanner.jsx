/* ClassBanner — top + bottom classification strip. Fixed. */
function ClassBanner({ level = 'UNCLASSIFIED // FOR OFFICIAL USE ONLY' }) {
  return <div className="class-banner">{level}</div>;
}
Object.assign(window, { ClassBanner });
