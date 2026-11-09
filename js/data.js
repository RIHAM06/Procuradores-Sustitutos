/**
 * Base de datos judicial de España y gestión de procuradores sustitutos
 * Incluye Partidos Judiciales Principales y Juzgados de Paz en todas las Comunidades Autónomas.
 */

const DEFAULT_COURTS_DATA = [
  // --- MADRID ---
  {
    id: "mad-01",
    name: "Sede Judicial Plaza de Castilla (Juzgados de Instrucción y 1ª Instancia)",
    type: "principal",
    category: "Juzgados de 1ª Instancia e Instrucción",
    city: "Madrid",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Plaza de Castilla, 1, 28046 Madrid",
    lat: 40.4665,
    lng: -3.6892,
    phone: "914 93 28 00"
  },
  {
    id: "mad-02",
    name: "Sede Judicial Poeta Joan Maragall (Juzgados de lo Social y Mercantil)",
    type: "principal",
    category: "Juzgados de lo Social y Mercantil",
    city: "Madrid",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Calle del Poeta Joan Maragall, 66, 28020 Madrid",
    lat: 40.4610,
    lng: -3.6930,
    phone: "914 93 40 00"
  },
  {
    id: "mad-03",
    name: "Juzgados de Alcalá de Henares (Partido Judicial nº 1)",
    type: "principal",
    category: "Partido Judicial",
    city: "Alcalá de Henares",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Plaza de la Paloma, 1, 28801 Alcalá de Henares",
    lat: 40.4820,
    lng: -3.3644,
    phone: "918 87 91 00"
  },
  {
    id: "mad-04",
    name: "Juzgados de Alcobendas (Partido Judicial nº 9)",
    type: "principal",
    category: "Partido Judicial",
    city: "Alcobendas",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Calle de la Fresa, 4, 28100 Alcobendas",
    lat: 40.5475,
    lng: -3.6420,
    phone: "916 59 70 00"
  },
  {
    id: "mad-05",
    name: "Juzgados de Móstoles (Partido Judicial nº 6)",
    type: "principal",
    category: "Partido Judicial",
    city: "Móstoles",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Calle Luis Jiménez de Asúa, s/n, 28931 Móstoles",
    lat: 40.3222,
    lng: -3.8647,
    phone: "916 64 80 00"
  },
  {
    id: "mad-06",
    name: "Juzgados de Getafe (Partido Judicial nº 4)",
    type: "principal",
    category: "Partido Judicial",
    city: "Getafe",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Avenida Juan Carlos I, s/n, 28905 Getafe",
    lat: 40.3083,
    lng: -3.7327,
    phone: "916 84 60 00"
  },
  {
    id: "mad-07",
    name: "Juzgados de Majadahonda (Partido Judicial nº 14)",
    type: "principal",
    category: "Partido Judicial",
    city: "Majadahonda",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Calle Joaquín Turina, s/n, 28220 Majadahonda",
    lat: 40.4731,
    lng: -3.8722,
    phone: "916 34 90 00"
  },
  {
    id: "mad-paz-01",
    name: "Juzgado de Paz de Brunete",
    type: "paz",
    category: "Juzgado de Paz",
    city: "Brunete",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Plaza Mayor, 1, 28690 Brunete",
    lat: 40.4045,
    lng: -3.9987,
    phone: "918 15 90 08"
  },
  {
    id: "mad-paz-02",
    name: "Juzgado de Paz de San Lorenzo de El Escorial",
    type: "paz",
    category: "Juzgado de Paz",
    city: "San Lorenzo de El Escorial",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Calle Duque de Medinaceli, 2, 28280 San Lorenzo de El Escorial",
    lat: 40.5912,
    lng: -4.1481,
    phone: "918 90 28 00"
  },
  {
    id: "mad-paz-03",
    name: "Juzgado de Paz de Ciempozuelos",
    type: "paz",
    category: "Juzgado de Paz",
    city: "Ciempozuelos",
    province: "Madrid",
    community: "Comunidad de Madrid",
    address: "Plaza de la Constitución, 1, 28350 Ciempozuelos",
    lat: 40.1585,
    lng: -3.6174,
    phone: "918 93 00 04"
  },

  // --- CATALUÑA (BARCELONA, GIRONA, TARRAGONA, LLEIDA) ---
  {
    id: "bcn-01",
    name: "Ciutat de la Justícia de Barcelona i l'Hospitalet",
    type: "principal",
    category: "Juzgados de 1ª Instancia, Instrucción y Social",
    city: "Barcelona",
    province: "Barcelona",
    community: "Cataluña",
    address: "Gran Via de les Corts Catalanes, 111, 08014 Barcelona",
    lat: 41.3638,
    lng: 2.1311,
    phone: "935 54 80 00"
  },
  {
    id: "bcn-02",
    name: "Juzgados de Sabadell (Partit Judicial nº 3)",
    type: "principal",
    category: "Partido Judicial",
    city: "Sabadell",
    province: "Barcelona",
    community: "Cataluña",
    address: "Avinguda de Francesc Macià, 34, 08208 Sabadell",
    lat: 41.5548,
    lng: 2.0967,
    phone: "937 45 42 00"
  },
  {
    id: "bcn-03",
    name: "Juzgados de Terrassa",
    type: "principal",
    category: "Partido Judicial",
    city: "Terrassa",
    province: "Barcelona",
    community: "Cataluña",
    address: "Rambla d'Ègara, 340, 08221 Terrassa",
    lat: 41.5630,
    lng: 2.0125,
    phone: "937 36 67 00"
  },
  {
    id: "bcn-paz-01",
    name: "Jutjat de Pau de Sitges",
    type: "paz",
    category: "Juzgado de Paz",
    city: "Sitges",
    province: "Barcelona",
    community: "Cataluña",
    address: "Plaça de l'Ajuntament, s/n, 08870 Sitges",
    lat: 41.2372,
    lng: 1.8115,
    phone: "938 11 76 00"
  },
  {
    id: "gir-01",
    name: "Palau de Justícia de Girona",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Girona",
    province: "Girona",
    community: "Cataluña",
    address: "Plaça de Josep Maria Lidón, 1, 17001 Girona",
    lat: 41.9863,
    lng: 2.8242,
    phone: "972 18 16 00"
  },
  {
    id: "tar-01",
    name: "Palau de Justícia de Tarragona",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Tarragona",
    province: "Tarragona",
    community: "Cataluña",
    address: "Carrer Sant Antoni Maria Claret, 17, 43002 Tarragona",
    lat: 41.1189,
    lng: 1.2445,
    phone: "977 23 20 00"
  },
  {
    id: "lle-01",
    name: "Edifici Judicial Canyeret de Lleida",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Lleida",
    province: "Lleida",
    community: "Cataluña",
    address: "Carrer Canyeret, 3, 25007 Lleida",
    lat: 41.6176,
    lng: 0.6268,
    phone: "973 70 58 00"
  },

  // --- ANDALUCÍA ---
  {
    id: "sev-01",
    name: "Edificio Judicial Prado de San Sebastián (Sevilla)",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Sevilla",
    province: "Sevilla",
    community: "Andalucía",
    address: "Calle José María Moreno Galván, s/n, 41004 Sevilla",
    lat: 37.3828,
    lng: -5.9870,
    phone: "955 00 50 00"
  },
  {
    id: "sev-02",
    name: "Ciudad de la Justicia de Sevilla (Palmas Altas)",
    type: "principal",
    category: "Juzgados de lo Mercantil y Contencioso",
    city: "Sevilla",
    province: "Sevilla",
    community: "Andalucía",
    address: "Campus Palmas Altas, 41014 Sevilla",
    lat: 37.3456,
    lng: -5.9864,
    phone: "955 04 31 00"
  },
  {
    id: "sev-paz-01",
    name: "Juzgado de Paz de Tomares",
    type: "paz",
    category: "Juzgado de Paz",
    city: "Tomares",
    province: "Sevilla",
    community: "Andalucía",
    address: "Calle de la Fuente, 10, 41920 Tomares",
    lat: 37.3752,
    lng: -6.0441,
    phone: "954 15 91 20"
  },
  {
    id: "mal-01",
    name: "Ciudad de la Justicia de Málaga",
    type: "principal",
    category: "Audiencia Provincial y Juzgados Centrales",
    city: "Málaga",
    province: "Málaga",
    community: "Andalucía",
    address: "Calle Fiscal Luis Portero García, s/n, 29010 Málaga",
    lat: 36.7169,
    lng: -4.4578,
    phone: "951 93 90 00"
  },
  {
    id: "mal-02",
    name: "Juzgados de Marbella (Partido Judicial nº 7)",
    type: "principal",
    category: "Partido Judicial",
    city: "Marbella",
    province: "Málaga",
    community: "Andalucía",
    address: "Avenida Arias de Velasco, 17, 29601 Marbella",
    lat: 36.5186,
    lng: -4.8872,
    phone: "951 97 10 00"
  },
  {
    id: "gra-01",
    name: "Tribunal Superior de Justicia de Andalucía y Juzgados (Granada)",
    type: "principal",
    category: "TSJ Andalucía y Juzgados Plaza Nueva",
    city: "Granada",
    province: "Granada",
    community: "Andalucía",
    address: "Plaza Nueva, 10, 18010 Granada",
    lat: 37.1772,
    lng: -3.5960,
    phone: "958 02 74 00"
  },
  {
    id: "cor-01",
    name: "Ciudad de la Justicia de Córdoba",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Córdoba",
    province: "Córdoba",
    community: "Andalucía",
    address: "Calle Isla Gomera, s/n, 14011 Córdoba",
    lat: 37.8931,
    lng: -4.7981,
    phone: "957 74 50 00"
  },
  {
    id: "cad-01",
    name: "Palacio de Justicia de Cádiz",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Cádiz",
    province: "Cádiz",
    community: "Andalucía",
    address: "Cuesta de las Calesas, s/n, 11006 Cádiz",
    lat: 36.5298,
    lng: -6.2891,
    phone: "956 01 27 00"
  },
  {
    id: "cad-02",
    name: "Juzgados de Algeciras",
    type: "principal",
    category: "Partido Judicial",
    city: "Algeciras",
    province: "Cádiz",
    community: "Andalucía",
    address: "Plaza de la Constitución, s/n, 11201 Algeciras",
    lat: 36.1308,
    lng: -5.4496,
    phone: "956 58 60 00"
  },
  {
    id: "alm-01",
    name: "Ciudad de la Justicia de Almería",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Almería",
    province: "Almería",
    community: "Andalucía",
    address: "Carretera de Ronda, s/n, 04005 Almería",
    lat: 36.8390,
    lng: -2.4570,
    phone: "950 01 10 00"
  },
  {
    id: "huelva-01",
    name: "Palacio de Justicia de Huelva",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Huelva",
    province: "Huelva",
    community: "Andalucía",
    address: "Alameda Sundheim, 27, 21003 Huelva",
    lat: 37.2562,
    lng: -6.9448,
    phone: "959 01 32 00"
  },
  {
    id: "jaen-01",
    name: "Juzgados de Jaén",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Jaén",
    province: "Jaén",
    community: "Andalucía",
    address: "Calle Arquitecto Berges, 16, 23007 Jaén",
    lat: 37.7712,
    lng: -3.7885,
    phone: "953 01 20 00"
  },

  // --- COMUNIDAD VALENCIANA ---
  {
    id: "val-01",
    name: "Ciutat de la Justícia de València",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Valencia",
    province: "Valencia",
    community: "Comunidad Valenciana",
    address: "Avinguda del Professor López Piñero, 14, 46013 Valencia",
    lat: 39.4542,
    lng: -0.3541,
    phone: "961 92 70 00"
  },
  {
    id: "val-02",
    name: "Juzgados de Gandia",
    type: "principal",
    category: "Partido Judicial",
    city: "Gandia",
    province: "Valencia",
    community: "Comunidad Valenciana",
    address: "Carrer Ciutat Laval, 1, 46701 Gandia",
    lat: 38.9669,
    lng: -0.1835,
    phone: "962 82 91 00"
  },
  {
    id: "val-paz-01",
    name: "Jutjat de Pau de Torrent (Poblaciones vinculadas)",
    type: "paz",
    category: "Juzgado de Paz",
    city: "Picanya",
    province: "Valencia",
    community: "Comunidad Valenciana",
    address: "Plaça del País Valencià, 1, 46210 Picanya",
    lat: 39.4357,
    lng: -0.4350,
    phone: "961 59 44 60"
  },
  {
    id: "ali-01",
    name: "Palacio de Justicia de Alicante (Pardo Gimeno)",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Alicante",
    province: "Alicante",
    community: "Comunidad Valenciana",
    address: "Calle Pardo Gimeno, 43, 03007 Alicante",
    lat: 38.3415,
    lng: -0.5012,
    phone: "965 93 50 00"
  },
  {
    id: "ali-02",
    name: "Ciudad de la Justicia de Elche",
    type: "principal",
    category: "Partido Judicial",
    city: "Elche",
    province: "Alicante",
    community: "Comunidad Valenciana",
    address: "Calle Abogados de Atocha, 1, 03203 Elche",
    lat: 38.2731,
    lng: -0.6865,
    phone: "966 91 70 00"
  },
  {
    id: "ali-03",
    name: "Juzgados de Benidorm",
    type: "principal",
    category: "Partido Judicial",
    city: "Benidorm",
    province: "Alicante",
    community: "Comunidad Valenciana",
    address: "Paseo Tolls, 1, 03502 Benidorm",
    lat: 38.5447,
    lng: -0.1345,
    phone: "966 87 88 00"
  },
  {
    id: "cas-01",
    name: "Ciudad de la Justicia de Castellón de la Plana",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Castellón de la Plana",
    province: "Castellón",
    community: "Comunidad Valenciana",
    address: "Bulevar Blasco Ibáñez, 10, 12003 Castellón",
    lat: 39.9860,
    lng: -0.0463,
    phone: "964 33 30 00"
  },

  // --- PAÍS VASCO ---
  {
    id: "bil-01",
    name: "Palacio de Justicia de Bilbao (Barroeta Aldamar)",
    type: "principal",
    category: "Audiencia Provincial y TSJ País Vasco",
    city: "Bilbao",
    province: "Bizkaia",
    community: "País Vasco",
    address: "Calle Barroeta Aldamar, 10, 48001 Bilbao",
    lat: 43.2642,
    lng: -2.9272,
    phone: "944 01 65 00"
  },
  {
    id: "bil-02",
    name: "Juzgados de Barakaldo",
    type: "principal",
    category: "Partido Judicial",
    city: "Barakaldo",
    province: "Bizkaia",
    community: "País Vasco",
    address: "Calle Bide Onera, s/n, 48901 Barakaldo",
    lat: 43.2974,
    lng: -2.9866,
    phone: "944 00 20 00"
  },
  {
    id: "ss-01",
    name: "Palacio de Justicia de Donostia - San Sebastián",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Donostia-San Sebastián",
    province: "Gipuzkoa",
    community: "País Vasco",
    address: "Plaza Teresa de Calcuta, 1, 20012 Donostia",
    lat: 43.3181,
    lng: -1.9744,
    phone: "943 00 07 00"
  },
  {
    id: "vit-01",
    name: "Palacio de Justicia de Vitoria-Gasteiz",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Vitoria-Gasteiz",
    province: "Álava",
    community: "País Vasco",
    address: "Avenida Gasteiz, 18, 01008 Vitoria-Gasteiz",
    lat: 42.8465,
    lng: -2.6811,
    phone: "945 00 48 00"
  },

  // --- GALICIA ---
  {
    id: "cor-g-01",
    name: "Tribunal Superior de Xustiza de Galicia (A Coruña)",
    type: "principal",
    category: "TSJ Galicia y Juzgados",
    city: "A Coruña",
    province: "A Coruña",
    community: "Galicia",
    address: "Praza de Galicia, s/n, 15004 A Coruña",
    lat: 43.3649,
    lng: -8.4055,
    phone: "981 18 20 00"
  },
  {
    id: "vig-01",
    name: "Cidade da Xustiza de Vigo",
    type: "principal",
    category: "Juzgados y Sección de Audiencia",
    city: "Vigo",
    province: "Pontevedra",
    community: "Galicia",
    address: "Rúa Padre Feijóo, s/n, 36204 Vigo",
    lat: 42.2289,
    lng: -8.7188,
    phone: "986 80 50 00"
  },
  {
    id: "san-01",
    name: "Xulgados de Santiago de Compostela",
    type: "principal",
    category: "Partido Judicial",
    city: "Santiago de Compostela",
    province: "A Coruña",
    community: "Galicia",
    address: "Rúa de Berlín, s/n, 15707 Santiago de Compostela",
    lat: 42.8805,
    lng: -8.5292,
    phone: "981 54 00 00"
  },
  {
    id: "our-01",
    name: "Pazo de Xustiza de Ourense",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Ourense",
    province: "Ourense",
    community: "Galicia",
    address: "Rúa do Progreso, 149, 32003 Ourense",
    lat: 42.3361,
    lng: -7.8687,
    phone: "988 68 70 00"
  },
  {
    id: "lug-01",
    name: "Xulgados de Lugo",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Lugo",
    province: "Lugo",
    community: "Galicia",
    address: "Rúa Armando Durán, 1, 27002 Lugo",
    lat: 43.0076,
    lng: -7.5539,
    phone: "982 29 45 00"
  },

  // --- ARAGÓN ---
  {
    id: "zar-01",
    name: "Ciudad de la Justicia de Zaragoza (Edificio Fueros de Aragón)",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Zaragoza",
    province: "Zaragoza",
    community: "Aragón",
    address: "Calle Galo Ponte, 1, 50018 Zaragoza",
    lat: 41.6705,
    lng: -0.8988,
    phone: "976 20 80 00"
  },
  {
    id: "hue-01",
    name: "Palacio de Justicia de Huesca",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Huesca",
    province: "Huesca",
    community: "Aragón",
    address: "Coso Alto, 18, 22002 Huesca",
    lat: 42.1396,
    lng: -0.4089,
    phone: "974 29 30 00"
  },
  {
    id: "ter-01",
    name: "Palacio de Justicia de Teruel",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Teruel",
    province: "Teruel",
    community: "Aragón",
    address: "Plaza San Juan, 6, 44001 Teruel",
    lat: 40.3432,
    lng: -1.1068,
    phone: "978 64 70 00"
  },

  // --- ASTURIAS ---
  {
    id: "ovi-01",
    name: "Palacio de Justicia de Oviedo",
    type: "principal",
    category: "Audiencia Provincial y TSJ Asturias",
    city: "Oviedo",
    province: "Asturias",
    community: "Principado de Asturias",
    address: "Calle Comandante Caballero, 3, 33005 Oviedo",
    lat: 43.3644,
    lng: -5.8502,
    phone: "985 96 28 00"
  },
  {
    id: "gij-01",
    name: "Palacio de Justicia de Gijón",
    type: "principal",
    category: "Partido Judicial",
    city: "Gijón",
    province: "Asturias",
    community: "Principado de Asturias",
    address: "Calle Decano Prendes Pando, 1, 33207 Gijón",
    lat: 43.5358,
    lng: -5.6664,
    phone: "985 17 50 00"
  },

  // --- CANTABRIA ---
  {
    id: "san-can-01",
    name: "Complejo Judicial Las Salesas (Santander)",
    type: "principal",
    category: "Audiencia Provincial y TSJ Cantabria",
    city: "Santander",
    province: "Cantabria",
    community: "Cantabria",
    address: "Avenida Pedro San Martín, s/n, 39010 Santander",
    lat: 43.4635,
    lng: -3.8245,
    phone: "942 35 71 00"
  },

  // --- CASTILLA Y LEÓN ---
  {
    id: "val-cyl-01",
    name: "Palacio de Justicia de Valladolid (Calle Angustias)",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Valladolid",
    province: "Valladolid",
    community: "Castilla y León",
    address: "Calle de las Angustias, 40, 47003 Valladolid",
    lat: 41.6548,
    lng: -4.7214,
    phone: "983 41 34 00"
  },
  {
    id: "bur-01",
    name: "Tribunal Superior de Justicia de Castilla y León (Burgos)",
    type: "principal",
    category: "TSJ CyL y Palacio de Justicia",
    city: "Burgos",
    province: "Burgos",
    community: "Castilla y León",
    address: "Paseo de la Isla, s/n, 09003 Burgos",
    lat: 42.3411,
    lng: -3.7077,
    phone: "947 28 40 00"
  },
  {
    id: "leo-01",
    name: "Palacio de Justicia de León",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "León",
    province: "León",
    community: "Castilla y León",
    address: "Calle Sáenz de Miera, 4, 24009 León",
    lat: 42.5936,
    lng: -5.5756,
    phone: "987 89 50 00"
  },
  {
    id: "sal-01",
    name: "Juzgados de Salamanca (Plaza Colón)",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Salamanca",
    province: "Salamanca",
    community: "Castilla y León",
    address: "Plaza de Colón, 6, 37001 Salamanca",
    lat: 40.9632,
    lng: -5.6631,
    phone: "923 28 41 00"
  },

  // --- CASTILLA-LA MANCHA ---
  {
    id: "tol-01",
    name: "Palacio de Justicia de Toledo (Marqués de Mendigorría)",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Toledo",
    province: "Toledo",
    community: "Castilla-La Mancha",
    address: "Calle Marqués de Mendigorría, 2, 45003 Toledo",
    lat: 39.8661,
    lng: -4.0242,
    phone: "925 28 80 00"
  },
  {
    id: "alb-01",
    name: "Tribunal Superior de Justicia de Castilla-La Mancha (Albacete)",
    type: "principal",
    category: "TSJ Castilla-La Mancha y Juzgados",
    city: "Albacete",
    province: "Albacete",
    community: "Castilla-La Mancha",
    address: "Calle San Agustín, 1, 02001 Albacete",
    lat: 38.9954,
    lng: -1.8562,
    phone: "967 59 65 00"
  },
  {
    id: "cr-01",
    name: "Palacio de Justicia de Ciudad Real",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Ciudad Real",
    province: "Ciudad Real",
    community: "Castilla-La Mancha",
    address: "Calle Caballeros, 11, 13001 Ciudad Real",
    lat: 38.9863,
    lng: -3.9298,
    phone: "926 27 50 00"
  },

  // --- REGIÓN DE MURCIA ---
  {
    id: "mur-01",
    name: "Ciudad de la Justicia de Murcia (Ronda Sur)",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Murcia",
    province: "Murcia",
    community: "Región de Murcia",
    address: "Avenida de la Justicia, s/n, 30011 Murcia",
    lat: 37.9712,
    lng: -1.1215,
    phone: "968 87 70 00"
  },
  {
    id: "car-01",
    name: "Palacio de Justicia de Cartagena",
    type: "principal",
    category: "Partido Judicial",
    city: "Cartagena",
    province: "Murcia",
    community: "Región de Murcia",
    address: "Calle Ángel Bruna, 21, 30203 Cartagena",
    lat: 37.6082,
    lng: -0.9829,
    phone: "968 32 60 00"
  },

  // --- ISLAS BALEARES ---
  {
    id: "ib-01",
    name: "Palau de Justícia de Palma (Sa Gerreria)",
    type: "principal",
    category: "TSJ Illes Balears y Juzgados",
    city: "Palma de Mallorca",
    province: "Illes Balears",
    community: "Islas Baleares",
    address: "Plaça del Mercat, 12 / Travessa d'en Ballester, 07002 Palma",
    lat: 39.5696,
    lng: 2.6502,
    phone: "971 72 32 00"
  },
  {
    id: "ib-02",
    name: "Juzgados de Ibiza (Eivissa)",
    type: "principal",
    category: "Partido Judicial",
    city: "Ibiza",
    province: "Illes Balears",
    community: "Islas Baleares",
    address: "Avinguda d'Isidor Macabich, 4, 07800 Eivissa",
    lat: 38.9103,
    lng: 1.4312,
    phone: "971 31 15 11"
  },
  {
    id: "ib-paz-01",
    name: "Jutjat de Pau de Formentera",
    type: "paz",
    category: "Juzgado de Paz",
    city: "Sant Francesc Xavier",
    province: "Illes Balears",
    community: "Islas Baleares",
    address: "Plaça de la Constitució, 1, 07860 Formentera",
    lat: 38.7058,
    lng: 1.4281,
    phone: "971 32 25 86"
  },

  // --- ISLAS CANARIAS ---
  {
    id: "can-01",
    name: "Ciudad de la Justicia de Las Palmas de Gran Canaria",
    type: "principal",
    category: "TSJ Canarias y Juzgados",
    city: "Las Palmas de Gran Canaria",
    province: "Las Palmas",
    community: "Canarias",
    address: "Calle Málaga, 2, 35016 Las Palmas de Gran Canaria",
    lat: 28.1002,
    lng: -15.4217,
    phone: "928 30 60 00"
  },
  {
    id: "can-02",
    name: "Palacio de Justicia de Santa Cruz de Tenerife",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Santa Cruz de Tenerife",
    province: "Santa Cruz de Tenerife",
    community: "Canarias",
    address: "Avenida Tres de Mayo, 3, 38003 Santa Cruz de Tenerife",
    lat: 28.4619,
    lng: -16.2575,
    phone: "922 47 40 00"
  },
  {
    id: "can-paz-01",
    name: "Juzgado de Paz de Candelaria",
    type: "paz",
    category: "Juzgado de Paz",
    city: "Candelaria",
    province: "Santa Cruz de Tenerife",
    community: "Canarias",
    address: "Calle Antolín Neira, s/n, 38530 Candelaria",
    lat: 28.3541,
    lng: -16.3718,
    phone: "922 50 08 00"
  },

  // --- NAVARRA ---
  {
    id: "nav-01",
    name: "Palacio de Justicia de Pamplona / Iruña",
    type: "principal",
    category: "Audiencia Provincial y TSJ Navarra",
    city: "Pamplona",
    province: "Navarra",
    community: "Comunidad Foral de Navarra",
    address: "Calle San Roque, 4, 31011 Pamplona",
    lat: 42.8144,
    lng: -1.6565,
    phone: "848 42 40 00"
  },

  // --- LA RIOJA ---
  {
    id: "rio-01",
    name: "Palacio de Justicia de Logroño (Marqués de Murrieta)",
    type: "principal",
    category: "Audiencia Provincial y TSJ La Rioja",
    city: "Logroño",
    province: "La Rioja",
    community: "La Rioja",
    address: "Calle Marqués de Murrieta, 45, 26005 Logroño",
    lat: 42.4648,
    lng: -2.4542,
    phone: "941 29 64 00"
  },

  // --- EXTREMADURA ---
  {
    id: "ext-01",
    name: "Tribunal Superior de Justicia de Extremadura (Cáceres)",
    type: "principal",
    category: "TSJ Extremadura y Juzgados",
    city: "Cáceres",
    province: "Cáceres",
    community: "Extremadura",
    address: "Plaza de San Mateo, s/n, 10003 Cáceres",
    lat: 39.4735,
    lng: -6.3708,
    phone: "927 62 02 00"
  },
  {
    id: "ext-02",
    name: "Palacio de Justicia de Badajoz",
    type: "principal",
    category: "Audiencia Provincial y Juzgados",
    city: "Badajoz",
    province: "Badajoz",
    community: "Extremadura",
    address: "Avenida de Colón, 8, 06005 Badajoz",
    lat: 38.8741,
    lng: -6.9749,
    phone: "924 21 00 00"
  },

  // --- CIUDADES AUTÓNOMAS ---
  {
    id: "ceu-01",
    name: "Palacio de Justicia de Ceuta",
    type: "principal",
    category: "Audiencia Provincial y Juzgados Mixtos",
    city: "Ceuta",
    province: "Ceuta",
    community: "Ceuta",
    address: "Calle Menéndez Pelayo, 2, 51001 Ceuta",
    lat: 35.8894,
    lng: -5.3198,
    phone: "956 52 40 00"
  },
  {
    id: "mel-01",
    name: "Palacio de Justicia de Melilla",
    type: "principal",
    category: "Audiencia Provincial y Juzgados Mixtos",
    city: "Melilla",
    province: "Melilla",
    community: "Melilla",
    address: "Calle San Francisco, s/n, 52001 Melilla",
    lat: 35.2936,
    lng: -2.9372,
    phone: "952 69 90 00"
  }
];

// Procuradores sustitutos predefinidos con contactos reales/funcionales y tarifas de sustitución
const DEFAULT_SUBSTITUTES_DATA = [
  {
    id: "proc-01",
    name: "Elena Morales Castillo",
    collegiateNumber: "Col. 3942 - Col. Madrid",
    phone: "+34 620 11 22 33",
    email: "elena.morales@procuradormadrid.es",
    price: 50,
    priceDetails: "50 € / Vista ordinaria o previa (exhortos 35 €)",
    courts: ["mad-01", "mad-02", "mad-04"],
    specialties: "Vistas Civiles, Mercantiles y Audiencias Previas",
    availability: "Inmediata de Lunes a Viernes (8:30 - 15:30)",
    notes: "Especialista en Plaza de Castilla y Poeta Joan Maragall. Presencia diaria garantizada."
  },
  {
    id: "proc-02",
    name: "Carlos Alberto Benítez Ruiz",
    collegiateNumber: "Col. 2814 - Col. Madrid Sur",
    phone: "+34 639 44 55 66",
    email: "carlos.benitez@sustitutosjusticia.es",
    price: 45,
    priceDetails: "45 € / Actuación (suplemento guardia 20 €)",
    courts: ["mad-05", "mad-06", "mad-paz-03"],
    specialties: "Penal, Juzgados de Guardia y Lanzamientos",
    availability: "24h para asistencias urgentes y señalamientos",
    notes: "Cubre toda el área de Móstoles, Fuenlabrada, Getafe y juzgados de paz limítrofes."
  },
  {
    id: "proc-03",
    name: "Marta Puigdemont i Soler",
    collegiateNumber: "Col. 1950 - ICP Barcelona",
    phone: "+34 645 88 99 00",
    email: "marta.puig@procuradors-cat.cat",
    price: 55,
    priceDetails: "55 € / Comparecencia o juicio verbal",
    courts: ["bcn-01", "bcn-02", "bcn-paz-01"],
    specialties: "Civil, Mercantil, Cláusulas Suelo y Ejecuciones Hipotecarias",
    availability: "Lunes a Viernes jornada continua",
    notes: "Despacho propio frente a Ciutat de la Justícia. Bilingüe catalán y castellano."
  },
  {
    id: "proc-04",
    name: "Javier Salgado Herranz",
    collegiateNumber: "Col. 4110 - Col. Sevilla",
    phone: "+34 670 12 34 56",
    email: "j.salgado@procuradoressevilla.com",
    price: 40,
    priceDetails: "40 € / Vista (30 € trámites/exhortos)",
    courts: ["sev-01", "sev-02", "sev-paz-01"],
    specialties: "Laboral, Contencioso-Administrativo y Conciliaciones CMAC",
    availability: "Tardes disponible para traslados y notificaciones urgentes",
    notes: "Amplia experiencia en Prado de San Sebastián y Ciudad de la Justicia."
  },
  {
    id: "proc-05",
    name: "Beatriz Navarro Alarcón",
    collegiateNumber: "Col. 3120 - Col. Valencia",
    phone: "+34 654 33 22 11",
    email: "b.navarro@procuradoresvalencia.org",
    price: 50,
    priceDetails: "50 € / Señalamiento",
    courts: ["val-01", "val-02", "val-paz-01"],
    specialties: "Familia, Menores, Civil e Incapacitaciones",
    availability: "Disponibilidad completa matinal",
    notes: "Atención meticulosa y envío de informe de la vista en el mismo día."
  },
  {
    id: "proc-06",
    name: "Gonzalo Bilbao de la Serna",
    collegiateNumber: "Col. 1422 - Col. Bizkaia",
    phone: "+34 611 77 88 99",
    email: "gonzalo.bilbao@procurador-euskadi.eus",
    price: 60,
    priceDetails: "60 € / Vista completa con grabación y acta",
    courts: ["bil-01", "bil-02", "ss-01"],
    specialties: "Mercantil, Concursal y Social",
    availability: "Lunes a Viernes 8:00 a 16:00",
    notes: "Desplazamientos rápidos entre Bilbao, Barakaldo y Donostia."
  },
  {
    id: "proc-07",
    name: "Ana Isabel Domínguez Souto",
    collegiateNumber: "Col. 2199 - Col. A Coruña",
    phone: "+34 680 99 11 22",
    email: "anadominguez@procuradoresgalicia.gal",
    price: 45,
    priceDetails: "45 € / Actuación judicial estándar",
    courts: ["cor-g-01", "vig-01", "san-01"],
    specialties: "Civil, Penal y Recursos de Apelación",
    availability: "Toda la semana",
    notes: "Cobertura integral del eje A Coruña - Santiago - Vigo."
  },
  {
    id: "proc-08",
    name: "Fernando Ruiz-Tagle Marín",
    collegiateNumber: "Col. 1877 - Col. Málaga",
    phone: "+34 661 55 44 33",
    email: "fruiztagle@procuradorescostadelsol.es",
    price: 60,
    priceDetails: "60 € en Málaga capital / 70 € en Marbella",
    courts: ["mal-01", "mal-02"],
    specialties: "Extranjería, Inmobiliario, Penal Económico",
    availability: "Idiomas: Español, Inglés y Francés",
    notes: "Especializado en sustituciones en juzgados de la Costa del Sol y Marbella."
  },
  {
    id: "proc-09",
    name: "Silvia Lázaro Palacios",
    collegiateNumber: "Col. 2631 - Col. Zaragoza",
    phone: "+34 633 22 55 88",
    email: "slazaro@procuradoreszaragoza.es",
    price: 45,
    priceDetails: "45 € / Vista",
    courts: ["zar-01", "hue-01"],
    specialties: "Agrario, Civil y Juicios sobre arrendamientos",
    availability: "Flexible con preaviso de 24 horas",
    notes: "Sustituciones tanto en la Ciudad de la Justicia de Zaragoza como en Huesca."
  },
  {
    id: "proc-10",
    name: "Antonio Riera Bonet",
    collegiateNumber: "Col. 0984 - Col. Baleares",
    phone: "+34 699 34 56 78",
    email: "ariera@procuradorsbalears.com",
    price: 65,
    priceDetails: "65 € Palma / 80 € Ibiza con desplazamiento",
    courts: ["ib-01", "ib-02", "ib-paz-01"],
    specialties: "Litigios náuticos, Civil y Mercantil internacional",
    availability: "Atención urgente interislas",
    notes: "Capacidad para sustituciones presenciales y videoconferencias en Sa Gerreria."
  },
  {
    id: "proc-11",
    name: "Carmen Rosa Dávila Henríquez",
    collegiateNumber: "Col. 1543 - Col. Las Palmas",
    phone: "+34 652 77 44 11",
    email: "carmendavila@procuradorescanarias.es",
    price: 50,
    priceDetails: "50 € / Vista",
    courts: ["can-01", "can-02", "can-paz-01"],
    specialties: "Tráfico, Responsabilidad Civil y Social",
    availability: "Lunes a Viernes",
    notes: "Cobertura en Santa Cruz de Tenerife, Las Palmas y Juzgados de Paz."
  },
  {
    id: "proc-12",
    name: "Raúl Gallego Osorio",
    collegiateNumber: "Col. 2930 - Col. Madrid",
    phone: "+34 615 88 12 34",
    email: "raul.gallego@procuradormadrid.es",
    price: 40,
    priceDetails: "40 € / Juzgados de Paz y Partidos periféricos",
    courts: ["mad-07", "mad-paz-01", "mad-paz-02"],
    specialties: "Juzgados de Paz, Conciliaciones, Bodas civiles y Ratificaciones",
    availability: "Vehículo propio, movilidad comarcal completa",
    notes: "Especialista en Juzgados de Paz del noroeste de Madrid (Brunete, El Escorial, etc.)."
  }
];

// Gestión del LocalStorage
const STORAGE_KEYS = {
  COURTS: "procuradores_courts_v2",
  SUBSTITUTES: "procuradores_subs_v1",
  AUTH: "procuradores_session_auth_v1"
};
window.STORAGE_KEYS = STORAGE_KEYS;

class DataService {
  constructor() {
    this.courts = this.loadCourts();
    this.substitutes = this.loadSubstitutes();
  }

  getFullCourtsReference() {
    if (window.SPAIN_JUDICIAL_DATABASE && Array.isArray(window.SPAIN_JUDICIAL_DATABASE) && window.SPAIN_JUDICIAL_DATABASE.length > 0) {
      return window.SPAIN_JUDICIAL_DATABASE;
    }
    return DEFAULT_COURTS_DATA;
  }

  loadCourts() {
    const fullDb = this.getFullCourtsReference();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COURTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= fullDb.length) return parsed;
      }
    } catch (e) {
      console.warn("Error cargando juzgados desde localStorage:", e);
    }
    this.saveCourts(fullDb);
    return JSON.parse(JSON.stringify(fullDb));
  }

  hydrateFullDatabase(fullDb) {
    if (!Array.isArray(fullDb) || fullDb.length === 0) return 0;
    const existingIds = new Set(this.courts.map((c) => c.id));
    let addedCount = 0;

    fullDb.forEach((c) => {
      if (!existingIds.has(c.id)) {
        this.courts.push(c);
        existingIds.add(c.id);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.saveCourts(this.courts);
    }
    return addedCount;
  }

  saveCourts(courts) {
    this.courts = courts;
    try {
      localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(courts));
    } catch (e) {
      console.error("Error guardando juzgados:", e);
    }
  }

  loadSubstitutes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBSTITUTES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Error cargando sustitutos desde localStorage:", e);
    }
    this.saveSubstitutes(DEFAULT_SUBSTITUTES_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_SUBSTITUTES_DATA));
  }

  saveSubstitutes(subs) {
    this.substitutes = subs;
    try {
      localStorage.setItem(STORAGE_KEYS.SUBSTITUTES, JSON.stringify(subs));
    } catch (e) {
      console.error("Error guardando sustitutos:", e);
    }
  }

  getCourts() {
    return this.courts;
  }

  getCourtById(id) {
    return this.courts.find(c => c.id === id);
  }

  getSubstitutes() {
    return this.substitutes;
  }

  getSubstitutesForCourt(courtId) {
    return this.substitutes.filter(s => Array.isArray(s.courts) && s.courts.includes(courtId));
  }

  getSubstitutesForProvince(province) {
    const courtIds = this.courts.filter(c => c.province.toLowerCase() === province.toLowerCase()).map(c => c.id);
    return this.substitutes.filter(s => s.courts.some(cId => courtIds.includes(cId)));
  }

  addSubstitute(subData) {
    const newSub = {
      id: "proc-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      ...subData
    };
    this.substitutes.unshift(newSub);
    this.saveSubstitutes(this.substitutes);
    return newSub;
  }

  updateSubstitute(id, updatedData) {
    const index = this.substitutes.findIndex(s => s.id === id);
    if (index !== -1) {
      this.substitutes[index] = { ...this.substitutes[index], ...updatedData, id };
      this.saveSubstitutes(this.substitutes);
      return this.substitutes[index];
    }
    return null;
  }

  deleteSubstitute(id) {
    this.substitutes = this.substitutes.filter(s => s.id !== id);
    this.saveSubstitutes(this.substitutes);
  }

  addCourt(courtData) {
    const newCourt = {
      id: "court-" + Date.now().toString(36),
      ...courtData
    };
    this.courts.push(newCourt);
    this.saveCourts(this.courts);
    return newCourt;
  }

  deleteCourt(id) {
    this.courts = this.courts.filter(c => c.id !== id);
    // Remover juzgado de los sustitutos asociados
    this.substitutes.forEach(s => {
      s.courts = s.courts.filter(cId => cId !== id);
    });
    this.saveCourts(this.courts);
    this.saveSubstitutes(this.substitutes);
  }

  resetToDefault() {
    const fullDb = this.getFullCourtsReference();
    this.saveCourts(fullDb);
    this.saveSubstitutes(DEFAULT_SUBSTITUTES_DATA);
    return { courts: this.courts, substitutes: this.substitutes };
  }

  exportBackupJSON() {
    const backup = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      courts: this.courts,
      substitutes: this.substitutes
    };
    return JSON.stringify(backup, null, 2);
  }

  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.courts) && Array.isArray(data.substitutes)) {
        this.saveCourts(data.courts);
        this.saveSubstitutes(data.substitutes);
        return { success: true, countCourts: data.courts.length, countSubs: data.substitutes.length };
      }
      return { success: false, error: "Formato de archivo inválido. Faltan colecciones de juzgados o sustitutos." };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// Instancia global
window.dataService = new DataService();
