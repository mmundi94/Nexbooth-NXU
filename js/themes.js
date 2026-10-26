/* Nexbooth themes.
   Edit this file to change lenses, phrases, captions, and defaults for each theme. */
window.NEXBOOTH_THEMES = (() => {
  const year = new Date().getFullYear();
  return [
    {
      id: 'everyday',
      name: 'Everyday',
      icon: 'star',
      caption: { title: 'Team Nexford', sub: 'Nexbooth  ·  ' + year },
      lenses: [
        { id: 'alpaca-me', name: 'Alpaca me', icon: 'alpaca-ears', items: [{ id: 'alpaca-ears', scale: 1.05 }], paint: ['blush'], rise: 'heart', hint: 'You are the alpaca now!' },
        { id: 'party', name: 'Party time', icon: 'party-hat', items: [{ id: 'party-hat', scale: 1.0, dx: 14 }], mouth: 'confetti', hint: 'Open your mouth for confetti!' },
        { id: 'royal', name: 'Royalty', icon: 'crown', items: [{ id: 'crown', scale: 0.95 }], orbit: 'sparkle' },
        { id: 'grad', name: 'Graduate', icon: 'grad-cap', items: [{ id: 'grad-cap', scale: 1.0 }], mouth: 'confetti', hint: 'Open your mouth to celebrate!' },
        { id: 'shades', name: 'Too cool', icon: 'shades', items: [{ id: 'shades', scale: 1.05 }], orbit: 'sparkle' },
        { id: 'love', name: 'Love struck', icon: 'heart-glasses', items: [{ id: 'heart-glasses', scale: 1.05 }], rise: 'heart', mouth: 'hearts', hint: 'Open your mouth for hearts!' },
        { id: 'scholar', name: 'Scholar', icon: 'specs', items: [{ id: 'specs', scale: 1.05 }, { id: 'mustache', scale: 1.0 }] },
      ],
      frames: ['none', 'classic', 'gold', 'confetti', 'minimal'],
      defaults: { frame: 'classic', filter: 'natural', fx: {} },
      words: ['Hello from Nexford!', 'Team Nexford', 'Learning designers, assemble!', 'Best team ever', 'Coffee first', 'We did it!', 'Alpaca-lyptic levels of fun', 'No prob-llama!', 'Say cheese!'],
    },
    {
      id: 'halloween',
      name: 'Halloween',
      icon: 'pumpkin',
      caption: { title: 'Happy Halloween', sub: 'Team Nexford  ·  ' + year },
      lenses: [
        { id: 'witch', name: 'Witchy', icon: 'witch-hat', items: [{ id: 'witch-hat', scale: 1.0 }], orbit: 'bat', mouth: 'candycorn', hint: 'Open your mouth for candy!' },
        { id: 'pumpkin', name: 'Pumpkin head', icon: 'pumpkin-hat', items: [{ id: 'pumpkin-hat', scale: 1.0, dy: 14 }], mouth: 'candycorn', hint: 'Open your mouth for candy!' },
        { id: 'vampire', name: 'Vampire', icon: 'fangs', items: [{ id: 'fangs', scale: 1.1 }], paint: ['pale'], mouth: 'bats', hint: 'Open your mouth to release the bats!' },
        { id: 'devil', name: 'Little devil', icon: 'devil-horns', items: [{ id: 'devil-horns', scale: 1.0 }], paint: ['devil'] },
        { id: 'cat', name: 'Black cat', icon: 'cat-ears', items: [{ id: 'cat-ears', scale: 1.0 }], paint: ['whiskers'] },
        { id: 'skeleton', name: 'Skeleton', icon: 'skull', items: [], paint: ['skull'] },
        { id: 'ghosted', name: 'Ghosted', icon: 'ghost', items: [], orbit: 'ghost', paint: ['pale'] },
      ],
      frames: ['none', 'spooky', 'pumpkins', 'classic', 'gold'],
      defaults: { frame: 'spooky', filter: 'midnight', fx: {} },
      words: ['Happy Halloween!', 'Boo!', 'Trick or treat!', 'Spooky season', 'Hocus pocus, time to focus', 'Team Nexford is spooktacular', 'Alpaca-boo!', 'Creep it real'],
    },
    {
      id: 'thanksgiving',
      name: 'Thanksgiving',
      icon: 'leaf',
      caption: { title: 'Happy Thanksgiving', sub: 'Thankful for Team Nexford  ·  ' + year },
      lenses: [
        { id: 'pilgrim', name: 'Pilgrim', icon: 'pilgrim-hat', items: [{ id: 'pilgrim-hat', scale: 1.0 }], mouth: 'leaves', hint: 'Open your mouth for falling leaves!' },
        { id: 'autumn', name: 'Autumn crown', icon: 'leaf-crown', items: [{ id: 'leaf-crown', scale: 1.05 }], paint: ['blush'], orbit: 'leaf' },
        { id: 'turkey', name: 'Turkey time', icon: 'turkey-feathers', items: [{ id: 'turkey-feathers', scale: 1.05, dy: -18 }], mouth: 'leaves', hint: 'Open your mouth and gobble!' },
        { id: 'chef', name: 'Master chef', icon: 'chef-hat', items: [{ id: 'chef-hat', scale: 1.0 }, { id: 'mustache', scale: 1.0 }] },
        { id: 'cozy', name: 'Cozy', icon: 'beanie', items: [{ id: 'beanie', scale: 1.05, dy: 8 }], paint: ['blush'], mouth: 'leaves', hint: 'Open your mouth for leaves!' },
      ],
      frames: ['none', 'autumn', 'harvest', 'classic', 'gold'],
      defaults: { frame: 'autumn', filter: 'harvest', fx: { leaves: true } },
      words: ['Happy Thanksgiving!', 'Thankful for this team', 'Grateful', 'Gobble gobble!', 'Pie time', 'So much to be thankful for', 'Thanks a latte, team!', 'Feeling grateful at Nexford'],
    },
    {
      id: 'holidays',
      name: 'Holidays',
      icon: 'snowflake',
      caption: { title: 'Happy Holidays', sub: 'Team Nexford  ·  ' + year },
      lenses: [
        { id: 'santa', name: 'Santa', icon: 'santa-hat', items: [{ id: 'santa-hat', scale: 1.05 }, { id: 'santa-beard', scale: 1.0 }], paint: ['rosy'], mouth: 'snow', hint: 'Open your mouth for snow!' },
        { id: 'rudolph', name: 'Rudolph', icon: 'antlers', items: [{ id: 'antlers', scale: 1.05 }, { id: 'red-nose', scale: 1.0 }], paint: ['rosy'] },
        { id: 'elf', name: 'Elf', icon: 'elf-hat', items: [{ id: 'elf-hat', scale: 1.0 }], paint: ['rosy'], orbit: 'sparkle' },
        { id: 'snowday', name: 'Snow day', icon: 'earmuffs', items: [{ id: 'earmuffs', scale: 1.0, dy: 22 }], paint: ['rosy'], mouth: 'snow', hint: 'Open your mouth for snow!' },
        { id: 'newyear', name: 'New Year', icon: 'star-glasses', items: [{ id: 'star-glasses', scale: 1.1 }, { id: 'party-hat', scale: 0.9, dx: 14 }], mouth: 'confetti', hint: 'Open your mouth for confetti!' },
      ],
      frames: ['none', 'lights', 'garland', 'snowy', 'candy', 'classic', 'gold'],
      defaults: { frame: 'lights', filter: 'natural', fx: { snow: true } },
      words: ['Happy Holidays!', 'Merry Christmas!', 'Fleece Navidad!', 'Ho Ho Ho!', 'Merry Alpaca-mas!', "Season's Greetings!", 'Cheers to a great year!', 'Happy New Year!'],
    },
  ];
})();
