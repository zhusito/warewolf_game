import werewolfImage from './assets/werewolf.png';
import alphaWerewolfImage from './assets/alpha werewolf.png';
import vampireImage from './assets/vampir.png';
import cursedImage from './assets/cursed.png';
import lycanImage from './assets/lycan.png';
import strongVillagerImage from './assets/strong vilager.png';
import guardianImage from './assets/guardian.png';
import seerImage from './assets/seer.png';
import witchImage from './assets/witch.png';
import hunterImage from './assets/hunter.png';
import cupidImage from './assets/cupid.png';
import kingImage from './assets/king.png';
import troublemakerImage from './assets/troublemaker.png';
import thiefImage from './assets/thief.png';
import villagerImage from './assets/vilager.png';
import loverImage from './assets/lover.png';

export const ROLE_IMAGES = {
  'Werewolf': werewolfImage,
  'Alpha Werewolf': alphaWerewolfImage,
  'Vampire': vampireImage,
  'Cursed': cursedImage,
  'Lycan': lycanImage,
  'Strong Villager': strongVillagerImage,
  'Guardian': guardianImage,
  'Seer': seerImage,
  'Witch': witchImage,
  'Hunter': hunterImage,
  'Cupid': cupidImage,
  'King': kingImage,
  'Troublemaker': troublemakerImage,
  'Thief': thiefImage,
  'Villager': villagerImage,
  'Lover': loverImage
};

export function getRoleImage(roleName) {
  return ROLE_IMAGES[roleName] || villagerImage;
}
