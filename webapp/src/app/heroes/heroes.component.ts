import { Component, OnInit } from '@angular/core';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';


@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrls: ['./heroes.component.css']
})

export class HeroesComponent implements OnInit {
  heroes: Hero[] = [];

  constructor(private heroService: HeroService) { }

  ngOnInit(): void {
    this.getHeroes();
  }

  getHeroes(): void {
    this.heroService.getHeroes()
    .subscribe(heroes => this.heroes = heroes);
  }

  add(name: string): void {
    name = name.trim();
    if (!name) { return; }
    this.heroService.addHero({ name } as Hero)
      .subscribe(hero => {
        this.heroes.push(hero);
      });
  }

  delete(hero: Hero): void {
    // remove the item from the list displayed, and assume the server will be successful in deleting the hero there too.
    this.heroes = this.heroes.filter(h => h !== hero);
    // even though we don't use the subscribe, the method with the observable will not do anything without a subscriber.
    this.heroService.deleteHero(hero.id).subscribe();
  }

}



//Heroes class before it was changed to be based on a dashboard, routing

// export class HeroesComponent implements OnInit {
//   heroes: Hero[] = [];
  
//   hero: Hero = {
//     id: 1,
//     name: 'Windstorm'
//   };
//   selectedHero?: Hero;

//   constructor(
//     private heroService: HeroService,
//     private messageService: MessageService) { }

//   ngOnInit(): void {
//     this.getHeroes();
//   }

//   onSelect(hero: Hero): void {
//     this.selectedHero = hero;
//     this.messageService.add(`HeroesComponent: Selected hero id=${hero.id}`);
//   }

//   getHeroes(): void {
//     this.heroService.getHeroes()
//         .subscribe(heroes => this.heroes = heroes);
//   }
// }