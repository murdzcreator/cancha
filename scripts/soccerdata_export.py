#!/usr/bin/env python3
"""Puente opcional SoccerData -> CANCHA. Nunca se ejecuta al abrir el sitio.
La fuente debe permitir las consultas y la reutilización pretendida; el usuario decide.
También acepta CSV ya obtenidos lícitamente sin instalar SoccerData.
"""
import argparse
import csv
import datetime as dt
import json
import math
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_LEAGUES = {'eng':'ENG-Premier League','esp':'ESP-La Liga','ita':'ITA-Serie A','fra':'FRA-Ligue 1'}
SOURCE_URLS = {'sofascore':'https://www.sofascore.com/','espn':'https://www.espn.com/soccer/', 'fbref':'https://fbref.com/'}

def is_blank(x):
    return x is None or (isinstance(x,float) and math.isnan(x)) or str(x).strip().lower() in ('', 'nan','none','nat','null')

def val(r,*keys):
    low={str(k).lower():v for k,v in r.items()}
    for key in keys:
        v=low.get(key.lower())
        if not is_blank(v):return v
    return None

def number(x):
    if is_blank(x):return None
    try:
        a=int(float(x))
        return a if a>=0 else None
    except (TypeError,ValueError):return None

def timestamp(x):
    if is_blank(x):return None
    if hasattr(x, 'isoformat'):
        try:return x.isoformat()
        except ValueError:return None
    s=str(x).strip().replace(' ', 'T', 1)
    try:dt.datetime.fromisoformat(s.replace('Z','+00:00'));return s
    except ValueError:return None

def fixname(v):return str(v or '').strip()

def normalize_fixture(r):
    home=val(r,'home_team','home','HomeTeam')
    away=val(r,'away_team','away','AwayTeam')
    date=timestamp(val(r,'date','kickoff','utc_date','datetime'))
    mid=number(val(r,'game_id','match_id','fixture_id','id'))
    if not home or not away or not date or not mid:return None
    h=number(val(r,'home_score','fthg','home_goals'))
    a=number(val(r,'away_score','ftag','away_goals'))
    status=fixname(val(r,'status'))
    allowed={'FINAL','PROGRAMADO','EN VIVO','APLAZADO','CANCELADO','SUSPENDIDO','SIN CONFIRMAR'}
    if status.upper() not in allowed:status='SIN CONFIRMAR' if h is not None else 'PROGRAMADO' if date[:10]>=dt.date.today().isoformat() else 'SIN CONFIRMAR'
    return {'id':str(mid),'date':date,'homeName':fixname(home),'awayName':fixname(away),'hs':h,'as':a,'status':status.upper(), 'round':str(val(r,'week','round') or '')}

def normalize_standing(r):
    team=val(r,'team','squad')
    if not team:return None
    keys={'pj':('mp','pj','played','matches_played'), 'g':('w','g','won','wins'), 'e':('d','e','draws'), 'p':('l','p','losses'), 'gf':('gf','goals_for'), 'gc':('ga','gc','goals_against'), 'pts':('pts','points')}
    out={'team':fixname(team)}
    for key,opts in keys.items():out[key]=number(val(r,*opts))
    out['dg']=number(val(r,'gd','dg','goal_difference')) if val(r,'gd','dg','goal_difference') is not None and str(val(r,'gd','dg','goal_difference')).strip()[0]!='-' else None
    return out

def normalize_match(r):return r

def load_csv(filename):
    with open(filename,encoding='utf-8-sig',newline='') as handle:
        return list(csv.DictReader(handle))

def download(args):
    try:import soccerdata as sd
    except ImportError as e:raise RuntimeError('Falta SoccerData. Instala con: py -m pip install soccerdata') from e
    lid=args.source_league or DEFAULT_LEAGUES.get(args.league)
    if not lid:raise RuntimeError('Liga sin ID confirmado para SoccerData: usa --source-league tras comprobarla con su documentación.')
    typ=args.dataset
    if args.provider=='sofascore':
        src=sd.Sofascore(leagues=lid,seasons=args.season)
        if typ=='fixtures':df=src.read_schedule()
        elif typ=='standings':df=src.read_league_table()
        else:raise RuntimeError('Sofascore no implementa read_lineup en SoccerData: utiliza ESPN para match.')
    elif args.provider=='espn':
        src=sd.ESPN(leagues=lid,seasons=args.season)
        if typ=='fixtures':df=src.read_schedule()
        elif typ=='match':df=src.read_lineup(match_id=int(args.match_id))
        else:raise RuntimeError('ESPN no ofrece read_league_table en este módulo: utiliza Sofascore para tablas.')
    else:raise RuntimeError('Proveedor no admitido para este tipo de exportación.')
    # Pandas treats index levels as columns only after reset_index()
    return df.reset_index().to_dict(orient='records')

def main():
    ap=argparse.ArgumentParser(description='Exportación optativa de SoccerData a CANCHA V14')
    ap.add_argument('--league',required=True,choices=['per','ucl','esp','eng','arg','ita','fra','bra','mex'])
    ap.add_argument('--season',required=True,help='Temporada idéntica al catálogo CANCHA; ej. 2026/27 o 2026')
    ap.add_argument('--dataset',required=True,choices=['fixtures','standings','match'])
    ap.add_argument('--provider',default='sofascore',choices=['sofascore','espn'])
    ap.add_argument('--csv',help='CSV ya adquirido con permiso: sin conexión externa ni instalación de soccerdata')
    ap.add_argument('--source-league',help='Código de competición solo si está confirmado para el proveedor')
    ap.add_argument('--match-id',help='Identificador del partido para obtener alineación ESPN')
    ap.add_argument('--acknowledge-source-terms',action='store_true',help='Confirma revisión de las condiciones de la fuente antes de acceder a ella')
    args=ap.parse_args()
    if args.dataset=='match' and not args.match_id:ap.error('--match-id es obligatorio para match')
    if not args.csv and not args.acknowledge_source_terms:ap.error('Para consultas externas, revisa los términos y usa --acknowledge-source-terms. No se habilita scraping por defecto.')
    raw=load_csv(args.csv) if args.csv else download(args)
    if args.dataset=='fixtures':data=[x for r in raw if (x:=normalize_fixture(r)) is not None]
    elif args.dataset=='standings':data=[x for r in raw if (x:=normalize_standing(r)) is not None]
    else:
        teams={}
        for i,r in enumerate(raw):
            team=val(r,'team');name=val(r,'player');
            if is_blank(team) or is_blank(name):continue
            stats={}
            for field in ('total_goals','goal_assists','total_shots','shots_on_target','yellow_cards','red_cards'):
                n=number(val(r,field))
                if n is not None:stats[field]=n
            teams.setdefault(fixname(team),[]).append({'id':str(i+1),'name':fixname(name),'number':number(val(r,'jersey','number')), 'position':fixname(val(r,'position')),'statistics':[stats] if stats else []})
        data=[{'id':str(args.match_id),'lineups':[{'team':k,'players':v,'formation':''} for k,v in teams.items()]}]
    if not data:raise RuntimeError('No se obtuvo ningún registro interpretable. No se modificó el proyecto.')
    out=ROOT/'data-imports'/'soccerdata'/f'{args.league}-{args.dataset}.json';out.parent.mkdir(parents=True,exist_ok=True)
    # validate target season from db.js without executing project code
    catalog=json.loads((ROOT/'db.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    target=next((l for l in catalog['leagues'] if l['id']==args.league),None)
    if target is None or target['season']!=args.season:raise RuntimeError(f'Temporada incompatible: CANCHA tiene {target["season"] if target else "no registrada"}.')
    output={'schema':'cancha-soccerdata-v1','league':args.league,'season':args.season,'kind':args.dataset,'provider':args.provider.upper() if args.csv else args.provider,'sourceUrl':SOURCE_URLS.get(args.provider,''),'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'records':data}
    tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8');tmp.replace(out)
    print(f'CANCHA: importación preparada: {out.name} · {len(data)} registros. Reinicia el servidor para revisar los datos.');return 0

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as exc:print(f'ERROR: {exc}',file=sys.stderr);sys.exit(1)
