export type Region = "Americas" | "EMEA" | "Pacific" | "China"

export interface Team {
  id: string
  name: string
  tag: string
  region: Region
  index: number // 1-12
}

export const KICKOFF_DATES: Record<Region, string> = {
  Americas: "2026-01-16",
  EMEA: "2026-01-20",
  Pacific: "2026-01-22",
  China: "2026-01-22",
}

export const TEAMS: Team[] = [
  // Americas
  { id: "sen", name: "Sentinels", tag: "SEN", region: "Americas", index: 1 },
  { id: "nrg", name: "NRG", tag: "NRG", region: "Americas", index: 2 },
  { id: "c9", name: "Cloud9", tag: "C9", region: "Americas", index: 3 },
  { id: "100t", name: "100 Thieves", tag: "100T", region: "Americas", index: 4 },
  { id: "lev", name: "Leviatán", tag: "LEV", region: "Americas", index: 5 },
  { id: "kru", name: "KRÜ Esports", tag: "KRÜ", region: "Americas", index: 6 },
  { id: "loud", name: "LOUD", tag: "LOUD", region: "Americas", index: 7 },
  { id: "fur", name: "FURIA", tag: "FUR", region: "Americas", index: 8 },
  { id: "mibr", name: "MIBR", tag: "MIBR", region: "Americas", index: 9 },
  { id: "g2", name: "G2 Esports", tag: "G2", region: "Americas", index: 10 },
  { id: "eg", name: "Evil Geniuses", tag: "EG", region: "Americas", index: 11 },
  { id: "envy", name: "Envy", tag: "ENVY", region: "Americas", index: 12 },
  // EMEA
  { id: "fnc", name: "Fnatic", tag: "FNC", region: "EMEA", index: 1 },
  { id: "navi", name: "Natus Vincere", tag: "NAVI", region: "EMEA", index: 2 },
  { id: "tl", name: "Team Liquid", tag: "TL", region: "EMEA", index: 3 },
  { id: "vit", name: "Team Vitality", tag: "VIT", region: "EMEA", index: 4 },
  { id: "kc", name: "Karmine Corp", tag: "KC", region: "EMEA", index: 5 },
  { id: "th", name: "Team Heretics", tag: "TH", region: "EMEA", index: 6 },
  { id: "gia", name: "GIANTX", tag: "GIA", region: "EMEA", index: 7 },
  { id: "fut", name: "FUT Esports", tag: "FUT", region: "EMEA", index: 8 },
  { id: "bbl", name: "BBL Esports", tag: "BBL", region: "EMEA", index: 9 },
  { id: "ulf", name: "ULF Esports", tag: "ULF", region: "EMEA", index: 10 },
  { id: "m8", name: "Gentle Mates", tag: "M8", region: "EMEA", index: 11 },
  { id: "pcf", name: "PCIFIC Esports", tag: "PCF", region: "EMEA", index: 12 },
  // Pacific
  { id: "prx", name: "Paper Rex", tag: "PRX", region: "Pacific", index: 1 },
  { id: "drx", name: "DRX", tag: "DRX", region: "Pacific", index: 2 },
  { id: "gen", name: "Gen.G", tag: "GEN", region: "Pacific", index: 3 },
  { id: "t1", name: "T1", tag: "T1", region: "Pacific", index: 4 },
  { id: "zeta", name: "ZETA DIVISION", tag: "ZETA", region: "Pacific", index: 5 },
  { id: "dfm", name: "DetonatioN FocusMe", tag: "DFM", region: "Pacific", index: 6 },
  { id: "fs", name: "FULL SENSE", tag: "FS", region: "Pacific", index: 7 },
  { id: "ts", name: "Team Secret", tag: "TS", region: "Pacific", index: 8 },
  { id: "rrq", name: "Rex Regum Qeon", tag: "RRQ", region: "Pacific", index: 9 },
  { id: "ge", name: "Global Esports", tag: "GE", region: "Pacific", index: 10 },
  { id: "var", name: "Varrel", tag: "VAR", region: "Pacific", index: 11 },
  { id: "ns", name: "Nongshim Redforce", tag: "NS", region: "Pacific", index: 12 },
  // China
  { id: "edg", name: "EDward Gaming", tag: "EDG", region: "China", index: 1 },
  { id: "fpx", name: "FunPlus Phoenix", tag: "FPX", region: "China", index: 2 },
  { id: "te", name: "Trace Esports", tag: "TE", region: "China", index: 3 },
  { id: "blg", name: "Bilibili Gaming", tag: "BLG", region: "China", index: 4 },
  { id: "jdg", name: "JD Gaming", tag: "JDG", region: "China", index: 5 },
  { id: "wol", name: "Wolves Esports", tag: "WOL", region: "China", index: 6 },
  { id: "tec", name: "Titan Esports Club", tag: "TEC", region: "China", index: 7 },
  { id: "tyl", name: "TYLOO", tag: "TYL", region: "China", index: 8 },
  { id: "drg", name: "Dragon Ranger Gaming", tag: "DRG", region: "China", index: 9 },
  { id: "nova", name: "Nova Esports", tag: "NOVA", region: "China", index: 10 },
  { id: "ag", name: "All Gamers", tag: "AG", region: "China", index: 11 },
  { id: "xlg", name: "Xi Lai Gaming", tag: "XLG", region: "China", index: 12 },
]
