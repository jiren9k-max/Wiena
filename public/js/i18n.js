/* WIENA — translations. Bosnian (bs) is the main language, English (en) the alternative.
   Language comes from ?lang=bs|en, then localStorage, then defaults to Bosnian.
   UI strings:  key: ['Bosanski', 'English']
   Product names, descriptions and prices come from the shop database (edited in /admin). */
(function () {
  const LANGS = ['bs', 'en'];
  const qp = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(qp)) localStorage.setItem('wiena_lang', qp);
  const lang = LANGS.includes(localStorage.getItem('wiena_lang')) ? localStorage.getItem('wiena_lang') : 'bs';
  document.documentElement.lang = lang;
  const I = lang === 'bs' ? 0 : 1;

  const D = {
    // ── meta
    'meta.home': ['WIENA | Prirodni tekstil za sporiji život', 'WIENA | Natural Textiles for Slow Living'],
    'meta.desc': ['Posteljina od kamenom pranog lana, kašmirski pledovi, peškiri od turskog pamuka i tihi predmeti za dom. Tkano u Evropi, dizajnirano u Beču.', 'Stonewashed linen bedding, cashmere throws, Turkish cotton towels and quiet objects for the home. Woven in Europe, designed in Vienna.'],

    // ── announcement bar
    'ann.1': ['Besplatna dostava za narudžbe preko {x}', 'Complimentary shipping over {x}'],
    'ann.2': ['Tkano od prirodnih vlakana u Evropi', 'Woven from natural fibres in Europe'],
    'ann.3': ['Povrat u roku od 30 dana', '30-day returns'],
    'ann.4': ['Poklon pakovanje uz svaku narudžbu', 'Gift wrapping on every order'],
    'ann.5': ['Novo: kolekcija Jesen/Zima', 'New: The Autumn/Winter Edit'],

    // ── header / nav
    'nav.shop': ['Kolekcija', 'Shop'],
    'nav.bedroom': ['Spavaća soba', 'Bedroom'],
    'nav.bath': ['Kupatilo', 'Bath'],
    'nav.living': ['Dnevni boravak', 'Living'],
    'nav.journal': ['Naša priča', 'Journal'],
    'nav.tagline': ['BEČ · TEKSTIL', 'VIENNA · TEXTILES'],
    'nav.search': ['Pretraga', 'Search'],
    'nav.bag': ['Korpa', 'Bag'],
    'nav.wishlist': ['Lista želja', 'Wishlist'],
    'nav.menu': ['Meni', 'Menu'],
    'mega.textiles': ['Tekstil', 'Textiles'],
    'mega.home': ['Dom', 'Home'],
    'mega.discover': ['Otkrijte', 'Discover'],
    'mega.new': ['Novo u ponudi', 'New In'],
    'mega.sale': ['Arhivska rasprodaja', 'Archive Sale'],
    'mega.all': ['Cijela kolekcija', 'Shop All'],
    'mega.rooms': ['Prostorije', 'Rooms'],
    'mega.featureKicker': ['Jesenska selekcija', 'The Autumn Edit'],
    'mega.featureTitle': ['Kašmir i alpaka', 'Cashmere &amp; Alpaca'],
    'mob.all': ['Cijela kolekcija', 'Shop All'],
    'mob.fragrance': ['Mirisi za dom', 'Home Fragrance'],
    'mob.sale': ['Rasprodaja', 'Sale'],
    'mob.est': ['Beč · Od 2026.', 'Vienna · Est. 2026'],

    // ── rooms
    'room.Bedroom': ['Spavaća soba', 'Bedroom'],
    'room.Bathroom': ['Kupatilo', 'Bathroom'],
    'room.Living': ['Dnevni boravak', 'Living'],
    'room.Dining': ['Trpezarija', 'Dining'],
    'room.Wardrobe': ['Garderoba', 'Wardrobe'],

    // ── cart
    'cart.title': ['Vaša korpa', 'Your Bag'],
    'cart.away': ['Još <b>{x}</b> do besplatne dostave', 'You’re <b>{x}</b> away from complimentary shipping'],
    'cart.free': ['Vaša narudžba ima <b>besplatnu dostavu</b> ✦', 'Your order ships <b>complimentary</b> ✦'],
    'cart.empty': ['Vaša korpa je prazna', 'Your bag is empty'],
    'cart.emptySub': ['Počnite s nečim mekanim.', 'Begin with something soft.'],
    'cart.explore': ['Istražite kolekciju', 'Explore the collection'],
    'cart.remove': ['Ukloni', 'Remove'],
    'cart.subtotal': ['Međuzbir', 'Subtotal'],
    'cart.note': ['PDV uključen. Dostava se obračunava pri plaćanju.', 'Taxes included. Shipping calculated at checkout.'],
    'cart.checkout': ['Na plaćanje', 'Checkout'],
    'cart.decrease': ['Smanji', 'Decrease'],
    'cart.increase': ['Povećaj', 'Increase'],
    'cart.close': ['Zatvori', 'Close'],

    // ── search
    'search.ph': ['Pretražite lan, kašmir, svijeće…', 'Search linen, cashmere, candles…'],
    'search.popular': ['Popularno', 'Popular'],
    'search.sugg': [['Lan', 'Kašmir', 'Peškir', 'Bouclé', 'Baršun', 'Svijeća', 'Žalfija'], ['Linen', 'Cashmere', 'Towel', 'Bouclé', 'Velvet', 'Candle', 'Sage']],
    'search.none': ['Nema rezultata za „{q}“. Pokušajte „lan“ ili „pled“.', 'Nothing found for “{q}”. Try “linen” or “throw”.'],

    // ── toasts / misc
    'toast.added': ['Dodano u korpu: <b>{name}</b>', '<b>{name}</b> added to your bag'],
    'toast.saved': ['Sačuvano u listu želja', 'Saved to your wishlist'],
    'toast.soldout': ['<b>{name}</b> je trenutno rasprodan.', '<b>{name}</b> is currently sold out.'],
    'toast.stock': ['Na zalihi je samo još {n} kom.', 'Only {n} left in stock.'],
    'card.soldout': ['Rasprodano', 'Sold out'],
    'pdp.soldout': ['Rasprodano', 'Sold out'],
    'pdp.low': ['Još samo {n} na zalihi', 'Only {n} left'],
    'f.pay1': ['Plaćanje pouzećem', 'Cash on delivery'],
    'f.pay2': ['Uplata na račun', 'Bank transfer'],

    // ── checkout
    'co.meta': ['WIENA | Završetak narudžbe', 'WIENA | Checkout'],
    'co.k': ['Sigurna narudžba', 'Secure checkout'],
    'co.title': ['Završetak <em class="italic">narudžbe</em>', 'Check<em class="italic">out</em>'],
    'co.contact': ['Kontakt podaci', 'Contact details'],
    'co.first': ['Ime', 'First name'],
    'co.last': ['Prezime', 'Last name'],
    'co.email': ['E-mail', 'Email'],
    'co.phone': ['Telefon', 'Phone'],
    'co.delivery': ['Dostava', 'Delivery'],
    'co.d.posta': ['Dostava na adresu', 'Home delivery'],
    'co.d.postaSub': ['Kurirska služba, 1–3 radna dana', 'By courier, 1–3 working days'],
    'co.d.studio': ['Preuzimanje u studiju', 'Studio pick-up'],
    'co.d.studioSub': ['{addr} · besplatno', '{addr} · free'],
    'co.address': ['Ulica i broj', 'Street address'],
    'co.city': ['Grad', 'City'],
    'co.zip': ['Poštanski broj', 'Postcode'],
    'co.payment': ['Plaćanje', 'Payment'],
    'co.p.pouzece': ['Plaćanje pouzećem', 'Cash on delivery'],
    'co.p.pouzeceSub': ['Platite kuriru ili pri preuzimanju', 'Pay the courier, or when you pick up'],
    'co.p.racun': ['Uplata na račun', 'Bank transfer'],
    'co.p.racunSub': ['Podatke za uplatu dobijate odmah nakon narudžbe', 'Bank details are shown right after you order'],
    'co.note': ['Napomena (nije obavezno)', 'Note (optional)'],
    'co.notePh': ['Npr. poklon pakovanje, vrijeme dostave…', 'E.g. gift wrapping, delivery time…'],
    'co.summary': ['Vaša narudžba', 'Your order'],
    'co.voucher': ['Kod za popust', 'Discount code'],
    'co.apply': ['Primijeni', 'Apply'],
    'co.remove': ['Ukloni', 'Remove'],
    'co.subtotal': ['Međuzbir', 'Subtotal'],
    'co.discount': ['Popust', 'Discount'],
    'co.shipping': ['Dostava', 'Shipping'],
    'co.free': ['Besplatno', 'Free'],
    'co.total': ['Ukupno', 'Total'],
    'co.kmNote': ['', 'Charged in convertible marks (KM): {km}'],
    'co.place': ['Naruči · {p}', 'Place order · {p}'],
    'co.placing': ['Šaljem narudžbu…', 'Placing your order…'],
    'co.terms': ['Klikom na „Naruči“ prihvatate uslove kupovine. Plaćanje karticom nije potrebno.', 'By placing your order you accept our terms of sale. No card payment needed.'],
    'co.empty': ['Vaša korpa je prazna.', 'Your bag is empty.'],
    'co.back': ['Nazad u kolekciju', 'Back to the collection'],
    'co.edit': ['Uredi korpu', 'Edit bag'],
    'co.done.k': ['Narudžba zaprimljena', 'Order received'],
    'co.done.t': ['Hvala, <em class="italic">{name}</em>', 'Thank you, <em class="italic">{name}</em>'],
    'co.done.p': ['Vaša narudžba <b>{n}</b> je zaprimljena. Potvrdu smo poslali na <b>{email}</b>, a javit ćemo vam se uskoro radi dogovora oko dostave.', 'Your order <b>{n}</b> has been received. A confirmation is on its way to <b>{email}</b>, and we will be in touch shortly to arrange delivery.'],
    'co.done.total': ['Za platiti', 'Amount due'],
    'co.bank': ['Podaci za uplatu', 'Bank transfer details'],
    'co.err.stock': ['Nekih artikala više nema u traženoj količini. Korpa je ažurirana, provjerite je i pokušajte ponovo.', 'Some items are no longer available in that quantity. Your bag has been updated, please check it and try again.'],
    'co.err.generic': ['Narudžba nije poslana. Provjerite podatke i pokušajte ponovo.', 'Your order could not be placed. Please check your details and try again.'],
    'co.err.net': ['Nema veze sa serverom. Provjerite internet i pokušajte ponovo.', 'Could not reach the shop. Check your connection and try again.'],
    'co.err.voucher': ['Kod nije važeći.', 'This code is not valid.'],
    'co.required': ['Popunite označena polja.', 'Please fill in the highlighted fields.'],
    'card.quick': ['Brzo dodaj', 'Quick add'],
    'card.save': ['Sačuvaj u listu želja', 'Save to wishlist'],
    'badge.New': ['Novo', 'New'],
    'badge.Bestseller': ['Najprodavanije', 'Bestseller'],
    'badge.Limited': ['Ograničeno', 'Limited'],
    'badge.Sale': ['Sniženo', 'Sale'],
    'cursor.view': ['Pogledaj', 'View'],
    'cursor.zoom': ['Uvećaj', 'Zoom'],
    'loader.sub': ['Tekstil za sporiji život', 'Textiles for slow living'],

    // ── footer
    'f.lead': ['Prirodni tekstil, tkan polako i napravljen da traje decenijama.', 'Natural textiles, woven slowly and made to be lived with for decades.'],
    'f.address': ['Studio i izložbeni salon<br>{addr}<br>{phone}<br>Uto–Sub · 10:00–18:00', 'Studio &amp; Showroom<br>{addr}<br>{phone}<br>Tue–Sat · 10:00–18:00'],
    'f.shop': ['Kupovina', 'Shop'],
    'f.help': ['Pomoć', 'Help'],
    'f.sale': ['Rasprodaja', 'Sale'],
    'f.shipping': ['Dostava', 'Shipping &amp; Delivery'],
    'f.returns': ['Povrat', 'Returns'],
    'f.care': ['Vodič za njegu tkanina', 'Fabric Care Guide'],
    'f.size': ['Vodič za veličine', 'Size Guide'],
    'f.contact': ['Kontakt', 'Contact'],
    'f.story': ['Naša priča', 'Our Story'],
    'f.mills': ['Tkaonice', 'The Mills'],
    'f.journal': ['Magazin', 'Journal'],
    'f.trade': ['Program za partnere', 'Trade Programme'],
    'f.copy': ['© {year} {name}{jib}. Fotografije: <a href="https://unsplash.com/license" target="_blank" rel="noopener" style="text-decoration:underline">Unsplash</a>.', '© {year} {name}{jib}. Photography via <a href="https://unsplash.com/license" target="_blank" rel="noopener" style="text-decoration:underline">Unsplash</a>.'],
    'f.legal': ['Privatnost · Uslovi korištenja · Impresum', 'Privacy · Terms · Imprint'],

    // ── home: hero
    'hero.1.k': ['Jesen / Zima 2026', 'Autumn / Winter 2026'],
    'hero.1.t': ['Umjetnost <em class="italic">sporog</em> življenja', 'The art of <em class="italic">slow</em> living'],
    'hero.1.l': ['Prirodni tekstil tkan u najstarijim evropskim porodičnim tkaonicama, za domove u kojima se zaista živi.', 'Natural textiles woven in Europe’s oldest family mills, for homes that feel truly lived in.'],
    'hero.2.k': ['Kamenom prani lan', 'Stonewashed Linen'],
    'hero.2.t': ['Mekše sa <em class="italic">svakom</em> noći', 'Softer with <em class="italic">every</em> night'],
    'hero.2.l': ['Belgijski lan, kamenom pran za mekoću od prve noći. Prozračan, iskren i beskrajno lijep.', 'Belgian flax, stonewashed for a lived-in softness from the very first night. Breathable, honest, endlessly beautiful.'],
    'hero.3.k': ['Kašmir i alpaka', 'Cashmere &amp; Alpaca'],
    'hero.3.t': ['Toplina <em class="italic">tkana</em> rukom', 'Warmth, <em class="italic">woven</em> by hand'],
    'hero.3.l': ['Pledovi i deke s razboja sa škotske granice i peruanskih visoravni.', 'Throws and blankets from shuttle looms in the Scottish Borders and the Peruvian highlands.'],
    'hero.cta': ['Pogledajte kolekciju', 'Shop the collection'],
    'hero.story': ['Naša priča', 'Our story'],
    'hero.season': ['Jesen / Zima 2026', 'Autumn / Winter 2026'],
    'hero.quote': ['„Ono što se pravi polako, pravi se da traje.“', '“Things that are made slowly, are made to last.”'],
    'hero.scroll': ['Skrolajte', 'Scroll'],
    'hero.slide': ['Slajd', 'Slide'],

    // ── home: sections
    'marquee': [['Lan', 'Kašmir', 'Alpaka', 'Merino', 'Turski pamuk', 'Dudova svila', 'Bouclé', 'Baršun'], ['Linen', 'Cashmere', 'Alpaca', 'Merino', 'Turkish Cotton', 'Mulberry Silk', 'Bouclé', 'Velvet']],
    'rooms.k': ['Kupujte po prostoriji', 'Shop by room'],
    'rooms.t': ['Svaka prostorija, <em class="italic">omekšana</em>', 'Every room, <em class="italic">softened</em>'],
    'rooms.p': ['Od spavaće sobe do trpezarijskog stola: prirodna vlakna, tiho lijepe boje i izrada koju osjetite pod prstima.', 'From the bedroom to the dining table: natural fibres, quietly beautiful colour, and craftsmanship you can feel.'],
    'rooms.explore': ['Istražite', 'Explore'],
    'rooms.Bedroom': ['Spavaća soba', 'Bedroom'],
    'rooms.Bath': ['Kupatilo', 'Bath'],
    'rooms.Living': ['Dnevni boravak', 'Living'],
    'rooms.Dining': ['Trpezarija', 'Dining'],
    'rooms.Fragrance': ['Mirisi', 'Fragrance'],
    'rooms.sub.Bedroom': ['Lan · Perkal · Svila', 'Linen · Percale · Silk'],
    'rooms.sub.Bath': ['Peškiri · Bademantili', 'Towels · Robes'],
    'rooms.sub.Living': ['Pledovi · Jastuci', 'Throws · Cushions'],
    'rooms.sub.Dining': ['Stolni tekstil · Keramika', 'Table linen · Ceramics'],
    'rooms.sub.Fragrance': ['Svijeće · Sprejevi', 'Candles · Mists'],
    'edit.k': ['Jesenska selekcija', 'The Autumn Edit'],
    'edit.t': ['Za <em class="italic">duge večeri</em>', 'Made for <em class="italic">long evenings</em>'],
    'edit.prev': ['Prethodno', 'Previous'],
    'edit.next': ['Sljedeće', 'Next'],
    'story.k': ['Naša priča · Od 2026.', 'Our story · Since 2026'],
    'story.t': ['Tkano polako, <em class="italic">u Evropi</em>', 'Woven slowly, <em class="italic">in Europe</em>'],
    'story.lede': ['Wiena je počela s jednom balom belgijskog lana i malim studijom kod Kohlmarkta u Beču.', 'Wiena began with a single bolt of Belgian linen and a small studio off Kohlmarkt in Vienna.'],
    'story.p': ['Radimo s dvanaest porodičnih tkaonica u Portugalu, Litvaniji, Škotskoj i Belgiji. To su tkaonice koje još koriste razboje sa čunkom, prirodne boje i vrijeme. Svako vlakno je sljedivo, svaki komad je prethodno opran i ništa se ne pravi na brzinu.', 'We work with twelve family-run mills across Portugal, Lithuania, Scotland and Belgium. They are weavers who still use shuttle looms, natural dyes and time. Every fibre is traceable, every piece is pre-washed, and nothing is made in a hurry.'],
    'story.s1': ['% prirodnih vlakana', '% natural fibres'],
    'story.s2': ['porodičnih tkaonica', 'family mills'],
    'story.s3': ['zanatlija', 'artisans'],
    'story.cta': ['Otkrijte kolekciju', 'Discover the collection'],
    'mat.k': ['Vlakna', 'The Fibres'],
    'mat.Linen': ['Lan', 'Linen'],
    'mat.Cashmere': ['Kašmir', 'Cashmere'],
    'mat.Alpaca': ['Alpaka', 'Alpaca'],
    'mat.Cotton': ['Pamuk', 'Cotton'],
    'mat.Silk': ['Svila', 'Silk'],
    'mat.Linen.d': ['Uzgaja se na hladnim obalnim poljima Belgije i Normandije i gotovo da ne treba navodnjavanje. Ispreden u lan, prozračan je, regulira temperaturu i jači je od pamuka.', 'Grown in the cool coastal fields of Belgium and Normandy, flax needs almost no irrigation. Spun into linen, it is breathable, temperature-regulating and stronger than cotton.'],
    'mat.Cashmere.d': ['Svakog proljeća ručno se češlja s mongolskih koza. Svako vlakno je finije od ljudske vlasi i daje izuzetnu toplinu za svoju težinu.', 'Combed by hand from Mongolian goats each spring. Each fibre is finer than a human hair, giving extraordinary warmth for its weight.'],
    'mat.Alpaca.d': ['Šuplja vlakna s peruanskih visoravni. Toplija od vune, prirodno hipoalergena i ispredena u bouclé mekan poput oblaka.', 'Hollow-core fibres from the Peruvian highlands. Warmer than wool, naturally hypoallergenic, and spun into a cloud-soft bouclé.'],
    'mat.Cotton.d': ['Dugovlaknasti pamuk s egejske obale, dvostruko uvijen za volumen. Temelj naših peškira i perkala.', 'Long-staple cotton from the Aegean coast, double-twisted for loft. It is the foundation of our towels and percale.'],
    'mat.Silk.d': ['Pjeskarena dudova svila od 22 momme, mekog mat sjaja. Nježna prema koži i kosi, hladna u toplim noćima.', 'Sand-washed 22 momme mulberry silk with a soft, matte glow. It is kind to skin and hair, and cool on warm nights.'],
    'best.k': ['Najomiljenije', 'Most loved'],
    'best.t': ['Naši <em class="italic">bestseleri</em>', 'The <em class="italic">bestsellers</em>'],
    'best.all': ['Pogledajte svih 100 proizvoda', 'View all 100 pieces'],
    'quote.k': ['Nekoliko riječi o lanu', 'A note on linen'],
    'quote.t': ['Lan je jedina tkanina koja postaje <em>ljepša</em> što više živite s njom. Svako pranje ga omekša, svaki nabor priča priču, a za deset godina i dalje će biti na vašem krevetu.', 'Linen is the only fabric that gets <em>more beautiful</em> the more you live in it. Every wash softens it, every crease tells a story, and in ten years it will still be on your bed.'],
    'quote.by': ['Osnivač, Wiena', 'Founder, Wiena'],
    'look.1': ['Spavaća soba s Wiena lanom', 'Bedroom styled with Wiena linen'],
    'look.2': ['Spavaća soba s baršunastim zavjesama', 'Bedroom with velvet curtains'],
    'look.3': ['Kupatilo s vafl peškirima', 'Bathroom with waffle towels'],
    'val.1.t': ['Prirodna vlakna', 'Natural fibres'],
    'val.1.p': ['Lan, vuna, pamuk i svila, sljedivi do samog polja. Bez sintetike, nikad.', 'Linen, wool, cotton and silk, traceable to the field. No synthetics, ever.'],
    'val.2.t': ['Besplatna dostava', 'Free shipping'],
    'val.2.p': ['Besplatna, ugljično neutralna dostava za narudžbe preko 300 KM.', 'Complimentary carbon-neutral delivery on orders over €150.'],
    'val.3.t': ['Povrat u 30 dana', '30-day returns'],
    'val.3.p': ['Prespavajte na tome. Ako vam ne odgovara, vratite besplatno.', 'Sleep on it. If it isn’t right, send it back free of charge.'],
    'val.4.t': ['Ručno upakovano', 'Wrapped by hand'],
    'val.4.p': ['Svaka narudžba stiže umotana u svileni papir i vezana lanenom trakom.', 'Every order arrives wrapped in tissue and tied with linen tape.'],
    'nl.k': ['Wiena pismo', 'The Wiena Letter'],
    'nl.t': ['Spore vijesti, <em class="italic">jednom mjesečno</em>', 'Slow news, <em class="italic">once a month</em>'],
    'nl.p': ['Nove kolekcije, priče iz tkaonica i rani pristup sezonskoj rasprodaji. Uz to 10% popusta na prvu narudžbu.', 'New collections, stories from the mills and early access to our seasonal archive sale. Plus 10% off your first order.'],
    'nl.ph': ['Vaša e-mail adresa', 'Your email address'],
    'nl.btn': ['Prijavite se', 'Subscribe'],
    'nl.thanks': ['Hvala vam. Pismo dobrodošlice je na putu. ✦', 'Thank you. Your welcome letter is on its way. ✦'],

    // ── shop
    'shop.meta': ['Kolekcija | WIENA', 'Shop | WIENA'],
    'shop.home': ['Početna', 'Home'],
    'shop.shop': ['Kolekcija', 'Shop'],
    'shop.allCrumb': ['Sve', 'Shop All'],
    'shop.title': ['Cijela <em class="italic">kolekcija</em>', 'The <em class="italic">Collection</em>'],
    'shop.blurb': ['Sto proizvoda od prirodnih vlakana: lan, pamuk, vuna, kašmir i svila, uz nekoliko tihih predmeta koji žive s njima.', 'One hundred pieces in natural fibres: linen, cotton, wool, cashmere and silk, plus a few quiet objects to live alongside them.'],
    'shop.room.Bedroom': ['Sve za mirniji san: lan, perkal, svila i vuna.', 'Everything for a slower night’s sleep: linen, percale, silk and wool.'],
    'shop.room.Bathroom': ['Peškiri, bademantili i hamami od teškog turskog pamuka i lana.', 'Towels, robes and hammams in heavy Turkish cotton and linen.'],
    'shop.room.Living': ['Pledovi, jastuci, zavjese i svijeće za prostoriju u kojoj provodite najviše vremena.', 'Throws, cushions, curtains and candles for the room you spend the most time in.'],
    'shop.room.Dining': ['Lan za sto i kamenina za sve što je na njemu.', 'Linen for the table and stoneware for everything on it.'],
    'shop.room.Wardrobe': ['Ogrtači, šalovi i ešarpe od vlakana iz naše kolekcije za dom.', 'Robes, scarves and stoles in our home fibres.'],
    'shop.sale.t': ['Arhivska <em class="italic">rasprodaja</em>', 'Archive <em class="italic">Sale</em>'],
    'shop.sale.p': ['Boje s kraja sezone po sniženim cijenama. Isti kvalitet, dok zalihe traju.', 'Last-of-season colours at reduced prices. Same quality, while they last.'],
    'shop.sale.c': ['Rasprodaja', 'Sale'],
    'shop.new.t': ['Novo <em class="italic">u ponudi</em>', 'New <em class="italic">In</em>'],
    'shop.new.p': ['Tek skinuto s razboja. Najnoviji dodaci Wiena kolekciji.', 'Fresh from the looms. The latest additions to the Wiena collection.'],
    'shop.new.c': ['Novo', 'New In'],
    'shop.wish.t': ['Vaša <em class="italic">lista želja</em>', 'Your <em class="italic">Wishlist</em>'],
    'shop.wish.p': ['Komadi koje ste sačuvali za kasnije. Ostaju ovdje i pri sljedećoj posjeti.', 'Pieces you’ve saved for later. They stay here between visits.'],
    'shop.wish.c': ['Lista želja', 'Wishlist'],
    'shop.search.p': ['Rezultati pretrage u cijeloj kolekciji.', 'Search results across the full collection.'],
    'shop.search.c': ['Pretraga', 'Search'],
    'shop.tab.all': ['Sve', 'All'],
    'shop.tab.new': ['Novo', 'New In'],
    'shop.tab.sale': ['Rasprodaja', 'Sale'],
    'shop.filter': ['Filtriraj', 'Filter'],
    'shop.refine': ['Filteri', 'Refine'],
    'shop.clear': ['Očisti', 'Clear'],
    'shop.clearAll': ['Očisti sve', 'Clear all'],
    'shop.show': ['Prikaži rezultate ({n})', 'Show {n} results'],
    'shop.colour': ['Boja', 'Colour'],
    'shop.fibre': ['Vlakno', 'Fibre'],
    'shop.price': ['Cijena', 'Price'],
    'shop.p.u75': ['Do 150 KM', 'Under €75'],
    'shop.p.75-150': ['150 – 300 KM', '€75 – €150'],
    'shop.p.150-300': ['300 – 600 KM', '€150 – €300'],
    'shop.p.o300': ['Preko 600 KM', 'Over €300'],
    'shop.sort.featured': ['Istaknuto', 'Featured'],
    'shop.sort.new': ['Najnovije', 'Newest'],
    'shop.sort.price-asc': ['Cijena: od najniže', 'Price, low to high'],
    'shop.sort.price-desc': ['Cijena: od najviše', 'Price, high to low'],
    'shop.sort.rating': ['Najbolje ocijenjeno', 'Top rated'],
    'shop.sortLabel': ['Sortiraj', 'Sort'],
    'shop.cols': ['{n} kolone', '{n} columns'],
    'shop.emptyWish': ['Vaša lista želja je prazna', 'Your wishlist is empty'],
    'shop.emptyWishP': ['Dodirnite srce na bilo kojem proizvodu da ga sačuvate ovdje.', 'Tap the heart on any piece to save it here.'],
    'shop.none': ['Trenutno nema rezultata', 'Nothing matches just yet'],
    'shop.noneP': ['Pokušajte ukloniti jedan ili dva filtera.', 'Try removing a filter or two.'],
    'shop.browse': ['Pogledajte sve', 'Browse everything'],
    'shop.showing': ['Prikazano {a} od {b}', 'Showing {a} of {b}'],
    'shop.more': ['Učitaj još', 'Load more'],

    // ── product
    'pdp.colour': ['Boja', 'Colour'],
    'pdp.size': ['Veličina', 'Size'],
    'pdp.pick': ['Odaberite veličinu', 'Select a size'],
    'pdp.pickErr': ['Molimo odaberite veličinu', 'Please choose a size'],
    'pdp.add': ['Dodaj u korpu · {p}', 'Add to bag · {p}'],
    'pdp.save': ['Sačuvaj', 'Save'],
    'pdp.perk1': ['Šalje se za 2–4 radna dana. Besplatno preko 300 KM.', 'Ships in 2–4 working days. Free over €150.'],
    'pdp.perk2': ['Povrat u roku od 30 dana, besplatno', '30-day returns, free of charge'],
    'pdp.perk3': ['Ručno umotano u svileni papir i lanenu traku', 'Wrapped by hand in tissue &amp; linen tape'],
    'pdp.details': ['Detalji i sastav', 'Details &amp; composition'],
    'pdp.care': ['Njega', 'Care'],
    'pdp.ship': ['Dostava i povrat', 'Shipping &amp; returns'],
    'pdp.shipText': ['Besplatna, ugljično neutralna dostava za narudžbe preko 300 KM. Dostupna je i ekspresna dostava. Nekorištene proizvode možete vratiti u roku od 30 dana uz puni povrat novca.', 'Complimentary carbon-neutral shipping on orders over €150 within the EU. Express delivery available. Unused items can be returned within 30 days for a full refund.'],
    'pdp.pairK': ['Upotpunite prostoriju', 'Complete the room'],
    'pdp.pairT': ['<em class="italic">Savršeno</em> se slaže s', 'Pairs <em class="italic">beautifully</em> with'],
    'pdp.moreK': ['Još iz kolekcije', 'More from the collection'],
    'pdp.moreT': ['Još: <em class="italic">{c}</em>', 'More <em class="italic">{c}</em>'],
    'pdp.viewAll': ['Pogledajte sve', 'View all'],

    // ── language switch
    'lang.label': ['Jezik', 'Language']
  };

  /* ───────── product overlay (Bosnian) ───────── */
  const BS = {
    cats: {
      'bed-linen': ['Posteljina', 'Kamenom prani lan, hrskavi perkal i prana svila. Posteljina koja je sa svakom noći mekša.'],
      bath: ['Kupatilo', 'Teški turski pamuk, prozračna vafl tkanja i hamam peškiri za spora jutra.'],
      throws: ['Pledovi i deke', 'Alpaka, merino i kašmir, tkani da se prebace, umotaju i naslijede.'],
      cushions: ['Jastuci', 'Baršun, lan i bouclé u paleti inspirisanoj austrijskim pejzažom.'],
      table: ['Stolni tekstil', 'Stolnjaci, staze i salvete za duge ručkove i kasne večere.'],
      curtains: ['Zavjese', 'Prozirni lan koji filtrira svjetlost i baršun koji čuva toplinu.'],
      wear: ['Odjeća i šalovi', 'Ogrtači, šalovi i ešarpe od istih vlakana kao naša kolekcija za dom.'],
      fragrance: ['Mirisi za dom', 'Ručno izlivene svijeće i sprejevi koji mirišu na svježe opranu posteljinu.'],
      ceramics: ['Keramika', 'Pjegava kamenina, ručno rađena u malim serijama.'],
      objects: ['Predmeti', 'Mesing, travertin i hrast. Tihi predmeti koji žive uz naš tekstil.']
    },
    colours: {
      Oat: 'Zobena', Chalk: 'Kreda', Ivory: 'Slonovača', Sand: 'Pijesak', Stone: 'Kamen', Sage: 'Žalfija', Olive: 'Maslinasta',
      Forest: 'Šumska zelena', 'Mist Blue': 'Maglovito plava', Ink: 'Tinta', Charcoal: 'Grafit', Clay: 'Glina', Terracotta: 'Terakota',
      'Rose Dust': 'Puderasto roza', Ochre: 'Oker', Camel: 'Kamel', Mocha: 'Moka', Bordeaux: 'Bordo', Lavender: 'Lavanda', Champagne: 'Šampanj',
      Brass: 'Mesing', 'Polished Brass': 'Polirani mesing', 'Oiled Oak': 'Nauljeni hrast'
    },
    on: 'i',
    fibres: {
      Linen: 'Lan', Cotton: 'Pamuk', 'Silk & Velvet': 'Svila i baršun', 'Wool & Cashmere': 'Vuna i kašmir', 'Alpaca & Mohair': 'Alpaka i moher',
      'Wax & Fragrance': 'Vosak i mirisi', Ceramic: 'Keramika', 'Brass, Stone & Wood': 'Mesing, kamen i drvo'
    },
    sizes: {
      Single: 'Jednokrevetna', Double: 'Bračna', King: 'King', 'Super King': 'Super King', 'Standard 50×75': 'Standardna 50×75', 'King 50×90': 'King 50×90',
      'Hand 50×90': 'Za ruke 50×90', 'Bath 70×140': 'Za kupanje 70×140', 'Sheet 100×180': 'Veliki 100×180', 'One size': 'Univerzalna veličina',
      'Set of 2, 50×90': 'Set od 2, 50×90', 'Double 50×200': 'Bračna 50×200', 'King 50×240': 'King 50×240',
      'One size, 70×200': 'Univerzalna, 70×200', 'One size, 60×190': 'Univerzalna, 60×190'
    },
    materials: {
      '100% European flax linen': '100% evropski lan', '400 thread-count cotton sateen': 'Pamučni saten, 400 niti',
      'Long-staple cotton percale': 'Perkal od dugovlaknastog pamuka', '22 momme mulberry silk': 'Dudova svila, 22 momme',
      'Yarn-dyed linen': 'Lan bojen u pređi', 'Linen shell, cotton wadding': 'Laneno lice, pamučna vata', 'Extra-fine merino wool': 'Ekstra fina merino vuna',
      '650 gsm Aegean cotton': 'Egejski pamuk, 650 g/m²', 'Honeycomb-weave cotton': 'Pamuk tkan u obliku saća', 'Flat-woven cotton': 'Ravno tkani pamuk',
      'Waffle-backed linen': 'Lan s vafl naličjem', 'Organic cotton terry': 'Organski pamučni frotir', 'Baby alpaca & wool bouclé': 'Bouclé od mlade alpake i vune',
      'Lambswool & merino': 'Janjeća vuna i merino', '100% Mongolian cashmere': '100% mongolski kašmir', 'Organic cotton waffle': 'Organski pamučni vafl',
      'Kid mohair & wool': 'Moher mladih koza i vuna', Lambswool: 'Janjeća vuna', 'Washed cotton velvet': 'Prani pamučni baršun',
      'Stonewashed linen': 'Kamenom prani lan', 'Wool bouclé': 'Vuneni bouclé', 'Cotton & linen jacquard': 'Žakard od pamuka i lana',
      'Heavyweight stonewashed linen': 'Teški kamenom prani lan', 'Linen & cotton': 'Lan i pamuk', 'Cotton damask': 'Pamučni damast',
      'Lightweight linen voile': 'Lagani laneni voal', 'Cotton velvet, blackout lining': 'Pamučni baršun, zamračujuća podstava',
      'Pure cashmere twill': 'Čisti kašmirski keper', 'Heavyweight linen canvas': 'Teško laneno platno',
      'Coconut & rapeseed wax, 220 g': 'Kokosov i repičin vosak, 220 g', 'Coconut & rapeseed wax, 300 g': 'Kokosov i repičin vosak, 300 g',
      'Linen & room spray, 100 ml': 'Sprej za posteljinu i prostor, 100 ml', 'Room spray, 100 ml': 'Sprej za prostor, 100 ml',
      'Reed diffuser, 200 ml': 'Mirisni štapići, 200 ml', 'Hand-thrown stoneware': 'Ručno rađena kamenina', 'Glazed stoneware': 'Glazirana kamenina',
      'Honed Roman travertine': 'Brušeni rimski travertin', 'Hand-woven seagrass': 'Ručno pletena morska trava', 'Solid cast brass': 'Puni liveni mesing',
      'Solid oiled oak': 'Puni nauljeni hrast'
    },
    details: {
      'bed-linen': ['Tkano u Portugalu od belgijskog i francuskog lana', 'OEKO-TEX® Standard 100 certifikat', 'Skriveno zatvaranje dugmadima od sedefa', 'Prethodno prano, bez iznenađenja sa skupljanjem'],
      bath: ['Egejski pamuk dugih vlakana', 'Dvostruko uvijena pređa za volumen i upijanje', 'Tkani rub, dvostruko prošiveni porubi', 'Proizvedeno u Denizliju, Turska'],
      throws: ['Tkano na starim razbojima sa čunkom', 'Ručno završeni rubovi i rese', 'Sljedivo vlakno, bez mulesinga', 'Proizvedeno u Škotskoj i Peruu'],
      cushions: ['Uložak od perja i paperja uključen', 'Skriveni patent-zatvarač', 'Ručno izrađen paspul', 'Proizvedeno u Litvaniji'],
      table: ['Teški kamenom prani lan', 'Ukošeni uglovi, duboki porubi', 'Sa svakim pranjem postaje mekši', 'Proizvedeno u Litvaniji'],
      curtains: ['Spremno za kačenje, s trakom za nabore', 'Otežani uglovi za uredan pad', 'Prirodna, nebijeljena završna obrada', 'Proizvedeno u Belgiji'],
      wear: ['Bojeno u gotovom komadu za dubinu boje', 'Opušten, uniseks kroj', 'Prirodna dugmad od korozo oraha', 'Proizvedeno u Portugalu i Škotskoj'],
      fragrance: ['Mješavina kokosovog i repičinog voska', 'Pamučni fitilj, više od 50 sati gorenja', 'Mirisna ulja bez ftalata', 'Ručno izliveno u Beču'],
      ceramics: ['Pjegava kamenina, reaktivna glazura', 'Sigurno za mašinu za suđe i hranu', 'Svaki komad je jedinstven', 'Izrađeno u studiju u Gmundenu'],
      objects: ['Puni materijali, bez presvlake', 'Podloga zaštićena filcom', 'Vremenom dobija prirodnu patinu', 'Proizvedeno u Austriji i Italiji']
    },
    care: {
      linen: 'Perite na 40 °C sa sličnim bojama. Sušite u mašini na niskoj temperaturi ili na zraku. Peglajte dok je vlažno ili jednostavno prihvatite nabore.',
      cotton: 'Perite na 40–60 °C. Izbjegavajte omekšivač kako bi vlakna ostala upijajuća. Sušite u mašini na niskoj temperaturi.',
      wool: 'Prozračite između korištenja. Čistite lokalno ili ručno perite u hladnoj vodi sa sredstvom za vunu. Sušite položeno, dalje od direktne toplote.',
      silk: 'Perite ručno u hladnoj vodi ili hemijski čistite. Ne cijedite. Peglajte s naličja na niskoj temperaturi.',
      home: 'Brišite mekom, suhom krpom. Držite dalje od izvora toplote i dugotrajne sunčeve svjetlosti.',
      candle: 'Prije svakog paljenja skratite fitilj na 5 mm. Neka gori 2–3 sata odjednom. Nikad ne ostavljajte svijeću bez nadzora.'
    },
    // English family name → [Bosnian name, Bosnian description]
  };

  /* ───────── API ───────── */
  function t(key, vars) {
    const e = D[key];
    let s = e ? e[I] : key;
    if (vars && typeof s === 'string') Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  // Bosnian plurals: 1, 21, 31… → singular; 2–4, 22–24… → paucal; rest → plural
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  const count = {
    pieces: (n) => (I === 0 ? `${n} ${plural(n, 'proizvod', 'proizvoda', 'proizvoda')}` : `${n} ${n === 1 ? 'piece' : 'pieces'}`),
    reviews: (n) => (I === 0 ? `${n} ${plural(n, 'recenzija', 'recenzije', 'recenzija')}` : `${n} reviews`)
  };

  /* Prices come from the shop database (admin): KM for Bosnian, € for English.
     products.js puts the right one into p.price, so price() is already in display currency. */
  const price = (n) => n;
  const fmt = (n) => (I === 0 ? `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} KM` : '€' + n.toLocaleString('en-IE', { maximumFractionDigits: 0 }));
  const money = (eur, qty) => fmt(price(eur) * (qty || 1));
  const SET = (window.WIENA_DATA && window.WIENA_DATA.settings) || {};
  const freeShip = I === 0 ? SET.free_shipping_over || 0 : SET.free_shipping_over_eur || 0; // display currency; 0 = no free shipping
  const shipFee = I === 0 ? SET.shipping_fee || 0 : SET.shipping_fee_eur || 0;
  const priceBands = I === 0 ? [150, 300, 600] : [75, 150, 300];
  const size = (s) => (I === 0 && BS.sizes[s]) || s;
  const room = (r) => t('room.' + r);
  const badge = (b) => t('badge.' + b);
  // search helper: lowercase and drop diacritics so "svijece" finds "svijeće"
  const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd');

  // forgiving match: "svijece" (plural) still finds "svijeca", "peskiri" finds "peskir"
  const match = (hay, term) => hay.includes(term) || (term.length > 4 && hay.includes(term.slice(0, -1)));

  /** Replace text in elements marked with data-i18n / data-i18n-ph / data-i18n-aria. */
  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    (root || document).querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    const meta = document.querySelector('meta[name="description"]');
    if (meta && document.body && document.body.dataset.page === 'home') meta.content = t('meta.desc');
  }

  function setLang(l) {
    if (!LANGS.includes(l) || l === lang) return;
    localStorage.setItem('wiena_lang', l);
    const u = new URL(location.href);
    u.searchParams.delete('lang');
    location.href = u.toString();
  }

  window.I18N = { lang, t, apply, setLang, money, price, fmt, freeShip, shipFee, priceBands, fibre: (k) => (I === 0 ? BS.fibres[k] || k : k), size, room, badge, count, fold, match, colour: (k) => (I === 0 ? BS.colours[k] || k : k) };
})();
