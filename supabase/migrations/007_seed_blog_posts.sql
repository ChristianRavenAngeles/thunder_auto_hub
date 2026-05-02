-- Seed initial blog posts for Thunder Auto Hub SEO
-- Note: blog_posts table has no category column — using tags array instead

insert into blog_posts (title, slug, excerpt, content, tags, is_published, published_at) values

(
  'Ceramic Coating vs. Wax: Alin ang Mas Maganda para sa Inyong Kotse?',
  'ceramic-coating-vs-wax',
  'Maraming car owners ang nagtatanong: ceramic coating ba o wax ang mas sulit? Alamin ang pagkakaiba at kung alin ang mas angkop sa inyong sasakyan at budget.',
  '<h2>Ano ang Wax?</h2><p>Ang car wax ay isang traditional na paint protection na gawa sa natural carnauba wax o synthetic polymer. Madaling i-apply at nagbibigay ng magandang gloss — pero tumatagal lang ng 1 hanggang 3 buwan bago mawala dahil sa init ng araw at regular na paghuhugas.</p><h2>Ano ang Ceramic Coating?</h2><p>Ang ceramic coating ay isang liquid polymer na nag-bo-bond sa paint ng inyong kotse at bumubuo ng isang hardened protective layer. Hindi ito natanggal ng tubig, UV rays, o kahit minor bird drops. Tumatagal ng 2–5 taon depende sa kalidad at maintenance.</p><h2>Pagkakaiba</h2><ul><li><strong>Durability:</strong> Ceramic — 2 to 5 taon | Wax — 1 to 3 buwan</li><li><strong>UV Protection:</strong> Ceramic — napalakas | Wax — katamtaman</li><li><strong>Hydrophobic Effect:</strong> Ceramic — tubig ay nagbe-bead at bumabagsak | Wax — mahina</li><li><strong>Cost:</strong> Ceramic — mas mahal upfront pero mas matipid long-term</li></ul><h2>Konklusyon</h2><p>Kung ikaw ay nagmamalasakit sa hitsura at resale value ng iyong kotse, ang ceramic coating ay ang pinakamatalinong investment. Sa Thunder Auto Hub, nag-o-offer kami ng 9H Ceramic at Graphene Coating na tumatagal ng 3–5 taon. Makipag-ugnayan sa amin para sa libreng paint consultation.</p>',
  array['Coating', 'Protection', 'Car Care'],
  true,
  now() - interval '7 days'
),

(
  '5 Maling Gawi sa Paghuhugas ng Kotse na Nagdudulot ng Scratches',
  '5-maling-paraan-ng-paghuhugas-ng-kotse',
  'Iniisip mo bang ligtas ang paraan ng paghuhugas mo ng kotse? Narito ang 5 pinakakaraniwang pagkakamali na puwedeng magdulot ng swirl marks at micro-scratches sa paint ng inyong sasakyan.',
  '<h2>1. Isang Timba Lang ng Tubig</h2><p>Ang paggamit ng iisang timba para sa lahat ng washing steps ay nagpapababa ng dumi pabalik sa iyong mitt at nagdudulot ng scratches. Gamitin ang two-bucket method — isang timba para sa soapy water, isa para sa pag-rinse ng mitt.</p><h2>2. Circular na Galaw</h2><p>Ang pag-wipe sa bilog na direksyon ay lumilikha ng tinatawag na swirl marks — makikita mo ito sa sunlight. Mag-wipe lagi nang straight lines ayon sa hugis ng kotse.</p><h2>3. Naghuhugas sa Direktang Araw</h2><p>Kapag mainit ang kotse at naghuhugas ka, ang tubig ay mabilis na natutuyo at nag-iiwan ng water spots na mahirap tanggalin. Hugasan sa shaded area o sa umaga/hapon.</p><h2>4. Maling Klase ng Tela</h2><p>Ang paggamit ng lumang t-shirt o basahan ay nagdudulot ng paint scratches. Gumamit lagi ng microfiber towel o wash mitt na espesyal para sa kotse.</p><h2>5. Hindi Pre-rinsing</h2><p>Bago mag-wash, dapat muna i-rinse ang buong kotse para matanggal ang malaking dumi at grit. Kapag hindi mo ito ginawa, ang mga ito ay nag-a-act na sandpaper sa iyong paint kapag naghuhugas ka.</p><h2>Ang Mas Madaling Solusyon</h2><p>Ang pinaka-safe na paraan ay ang magtiwala sa mga propesyonal. Sa Thunder Auto Hub, gumagamit kami ng proper washing techniques, pH-balanced shampoo, at microfiber tools para masigurong walang damage sa inyong paint.</p>',
  array['Car Wash', 'Tips', 'Paint Care'],
  true,
  now() - interval '3 days'
),

(
  'Gaano Kahalaga ang Interior Detailing? Ang Totoo Tungkol sa Inyong Sasakyan',
  'kahalagahan-ng-interior-detailing',
  'Hindi lang panlabas ang kailangang alagaan ng inyong kotse. Ang interior detailing ay nagpapanatili ng halaga ng inyong sasakyan at nagbibigay ng mas komportableng biyahe para sa inyong pamilya.',
  '<h2>Bakit Mahalaga ang Interior Detailing?</h2><p>Ang interior ng inyong kotse ay isang lugar kung saan kayo nagtratrabaho, nagbabakasyon, at nagdadala ng pamilya. Sa pagdaan ng panahon, nag-iipon ang alikabok, dumi, bacteria, at amoy na hindi na mapapansin ng naked eye — pero nararamdaman ang epekto sa kalusugan at comfort.</p><h2>Ano ang Kasama sa Interior Detailing?</h2><ul><li><strong>Deep Seat Cleaning</strong> — pag-alisin ng dumi sa lahat ng layer ng fabric o leather</li><li><strong>Carpet Shampooing</strong> — deep clean ng carpet at floor mats</li><li><strong>Dashboard UV Treatment</strong> — nagpoprotekta ng plastic at leather mula sa UV cracking</li><li><strong>Vent Detailing</strong> — pag-aalis ng naipon na alikabok sa air vents</li><li><strong>Odor Treatment</strong> — nagaalis ng amoy ng pagkain, aso, sigarilyo, at amag</li></ul><h2>Gaano Kadalas Dapat?</h2><p>Para sa regular na gamit, inirerekomenda namin ang interior detailing tuwing 3–6 buwan. Kung may alagang hayop, bata, o madalas na kumakain sa loob ng kotse, bawat 2–3 buwan ay mas mainam.</p><h2>Ang Pagkakaiba ng Professional vs. DIY</h2><p>Ang DIY interior cleaning ay kaya mong gawin sa bahay — pero ang professional detailing ay gumagamit ng industrial steamers, enzyme-based cleaners, at specialized tools na nagtatanggal ng bacteria at allergens na hindi kayang abutin ng regular vacuum.</p><p>Sa Thunder Auto Hub, ang aming Interior Detailing package ay nagsisimula sa P799 (Small vehicles). Dini-deliver namin ang serbisyo sa inyong pintuan — walang abala.</p>',
  array['Interior', 'Detailing', 'Car Care'],
  true,
  now() - interval '1 day'
);
