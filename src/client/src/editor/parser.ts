// This file was generated by lezer-generator. You probably shouldn't edit it.
import {LRParser} from "@lezer/lr"
import {readDelimitedString, readUndelimitedString, readMacroArguments, specializeSymbol} from "./helpers.js"
const spec_Symbol = {__proto__:null,PAGE:152, FIELD:154, RELOC:156, FIXMRI:158, FIXTAB:160, EXPUNG:162, EXPUNGE:162, DECIMA:164, DECIMAL:164, OCTAL:166, DEFINE:168, IFDEF:174, IFNDEF:176, IFZERO:178, IFNZRO:180, ZBLOCK:182, DUBL:184, FLTG:188, DEVICE:190, FILENAM:192, FILENAME:192, ENPUNC:194, ENPUNCH:194, NOPUNC:196, NOPUNCH:196, PAUSE:198, XLIST:200, EJECT:202, TEXT:204}
export const parser = LRParser.deserialize({
  version: 14,
  states: "<tOQOWOOOOOO'#Di'#DiO%|OWO'#CbO&TO`O'#CkO&lOWO'#DjO#jOWO'#CbOOOO'#Ck'#CkO)ROWO'#CkO)aO`O'#CiO){OWO'#CqO*gOWO'#CqOOOO'#Ci'#CiO+ROWO'#CgOOOO'#Cg'#CgO+dOWO'#CfOOOO'#Cs'#CsO+{O[O'#CtO,^OWO'#CvO,oOWO'#CxO-QOWO'#CyO-cOWO'#CzOOOO'#C{'#C{OOOO'#C|'#C|OOOO'#C}'#C}OOOO'#DO'#DOO-hOWO'#DPO-mOWO'#DRO-rOWO'#DSO-wOWO'#DTO-|OWO'#DUO.ROWO'#DVOOOO'#DY'#DYOOOO'#DX'#DXO.xOWO'#DWO/nOpO'#D]O0OOWO'#D_O0TOWO'#D`OOOO'#Da'#DaOOOO'#Db'#DbOOOO'#Dc'#DcOOOO'#Dd'#DdO0YOWO'#DeO0kOWO'#DfOOOO'#Cu'#CuOOOO'#Ce'#CeOOOO'#Cb'#CbO0pOWO'#CbO0xOWO'#CbOOOO'#Dh'#DhOQOWOOQOOOOOOOOO-E7g-E7gO3gOWO,58|OOOO,58|,58|O0pOWO,58|O3nOWO,58|OOOO,58},58}O3|OWO,59^O4TOWO,5:UOOOO-E7h-E7hOOOO,59V,59VO6jOWO'#DkO6{O`O,59UO){OWO,59]O7gOWO,59]O*gOWO,59]O8ROWO,59]O3|OWO'#DlO8mOWO,59SOOOO,59Q,59QOOOS'#Dm'#DmO9OO[O,59`O3|OWO,59bO3|OWO,59dO3|OWO,59eO9aOWO,59fO9fOWO,59kO9kOWO,59mO9pOWO,59nO9uOWO,59oO9uOWO,59pO3|OWO,59qOOOO'#Do'#DoO:POWO'#DoO:UOWO,59rOOOO'#Dp'#DpO:fO`O'#DpO:kOpO,59wO:{OQO,59yO;QOQO,59zO;VOQO,5:PO;[OPO,5:QO3nOWO,58|OOOO-E7f-E7fOOOO1G.h1G.hO0pOWO1G.hO;aOWO1G.hO;aOWO1G.hO3|OWO1G.xOOOO1G.x1G.xP;oOWO'#CcOOOO,5:V,5:VOOOO-E7i-E7iO;tOWO1G.wO;wOWO1G.wOOOO1G.w1G.wO<`OWO1G.wO<cOWO1G.wOOOO,5:W,5:WOOOO-E7j-E7jOOOS-E7k-E7kOOOO'#Cw'#CwOOOO1G.|1G.|OOOO1G/O1G/OOOOO1G/P1G/PO<zOWO1G/QO=POWO1G/VO=XOWO1G/XO=XOWO1G/YO=XOWO1G/ZO=XOWO1G/[OOOO1G/]1G/]OOOO,5:Z,5:ZOOOO-E7m-E7mOOOO,5:[,5:[OOOO-E7n-E7nOOOO1G/e1G/eOOOO1G/f1G/fOOOO1G/k1G/kOOOO1G/l1G/lOOOO7+$S7+$SO=aOWO7+$SO0pOWO7+$SOOOO7+$d7+$dO>QOWO7+$cOOOO7+$c7+$cO>[OWO7+$cO3|OWO7+$lO>fOWO'#DiO=XOWO7+$qO=POWO7+$qO>qOWO'#DQOOOO7+$q7+$qO=XOWO7+$sOOOO7+$s7+$sO=XOWO7+$tOOOO7+$t7+$tO=XOWO7+$uOOOO7+$u7+$uO=XOWO7+$vOOOO7+$v7+$vOOOO<<Gn<<GnO0pOWO<<GnOOOO<<G}<<G}O3|OWO<<HWOOOO<<HW<<HWOOOO,5:Y,5:YOOOO<<H]<<H]O=XOWO<<H]OOOO-E7l-E7lOOOO,59l,59lO?OOWO,59lOOOO<<H_<<H_OOOO<<H`<<H`OOOO<<Ha<<HaOOOO<<Hb<<HbOOOOAN=YAN=YOOOOAN=rAN=rOOOOAN=wAN=wP?]OWO'#DnOOOO1G/W1G/WO?bOWO,59]O?iOWO,59]O?pOWO1G.wO?wOWO1G.wO){OWO'#CqO@OOWO'#CqO@OOWO'#CqO@OOWO'#CqO@]OWO'#CqO@]OWO'#CqO*gOWO'#CqO){OWO,59]O@OOWO,59]O@OOWO,59]O@jOWO,59]O@jOWO,59]O@OOWO,59]O@OOWO,59]O@]OWO,59]O@]OWO,59]O*gOWO,59]O){OWO'#DlO@OOWO'#DlO@]OWO'#DlO@jOWO'#DlO@wOWO'#DlO*gOWO'#DlOAUOWO,59SOA]OWO,59SOAjOWO,59SOAxOWO,59SOBWOWO,59SOBcOWO,59SO@jOWO'#CqOBjOWO'#CgOBqOWO'#CgOCOOWO'#CgOC^OWO'#CgOClOWO'#CgOCwOWO'#CgO@OOWO'#CqO@jOWO'#Cq",
  stateData: "DO~OS`OWRO`VOaUObUOcUO}pO!O!OO!Z!SO!fPO!h^O!iXO!kYO!naO!obO!pcO!qdO!reO!sfO!tgO!uhO!viO!yjO!zkO!{lO!|mO!}nO#OqO#PoO#QrO#RsO#StO#TuO#UvO#VwO#WxO#XyO#YzO~OS`OWRO`VOaUObUOcUO}pO!O!WO!h^O!iXO!kYO!naO!obO!pcO!qdO!reO!sfO!tgO!uhO!viO!yjO!zkO!{lO!|mO!}nO#OqO#PoO#QrO#RsO#StO#TuO#UvO#VwO#WxO#XyO#YzO~O!fPO~P#jO!g!YO!m!ZOd_X}_X!O_X!f_X#P_X~O!fPOS!^XW!^X`!^Xa!^Xb!^Xc!^X}!^X!O!^X!h!^X!i!^X!k!^X!n!^X!o!^X!p!^X!q!^X!r!^X!s!^X!t!^X!u!^X!v!^X!y!^X!z!^X!{!^X!|!^X!}!^X#O!^X#P!^X#Q!^X#R!^X#S!^X#T!^X#U!^X#V!^X#W!^X#X!^X#Y!^X~OW!^Oa!^Ob!^Oc!^O~Od!_O}]X!O]X!f]X#P]X!j]X!l]X!w]X~OWUO`VOaUObUOcUO!fPO!i$uO!k$wO~OWUO`VOaUObUOcUO!fPO!i$vO!k${O~O!fPO}ZX!OZX!fZX#PZX~OWUO`VOaUObUOcUO!iXO!kYO~OR!hO}hX!OhX!fhX#PhX~O!fPO}jX!OjX!fjX#PjX~O!fPO}lX!OlX!flX#PlX~O!fPO}mX!OmX!fmX#PmX~O!f!mO~O!f!nO~O!f!oO~O!f!pO~O!f!qO~O!f!rO~O!fPO}yX!OyX!fyX#PyX~O`!uOa!tO}pO!O!tO!f!tO#PoO~O}zX!OzX!fzX#PzX~P.dO`!xO}pO!O!wO!Q!wO!f!wO#PoO~O}!PX!O!PX!f!PX#P!PX~P/YO!f!zO~O!f!{O~O!f!|O}!XX!O!XX!f!XX#P!XX~O!f!}O~O}pO#PoO~O}pO!O!WO!fPO#PoO~OS`OWRO`VOaUObUOcUO}pO!h^O!iXO!kYO!naO!obO!pcO!qdO!reO!sfO!tgO!uhO!viO!yjO!zkO!{lO!|mO!}nO#OqO#PoO#QrO#RsO#StO#TuO#UvO#VwO#WxO#XyO#YzO~O!O#RO~P1WO}pO!O#RO!fPO#PoO~O!fPO~P+dO!fPOS!^aW!^a`!^aa!^ab!^ac!^a}!^a!O!^a!h!^a!i!^a!k!^a!n!^a!o!^a!p!^a!q!^a!r!^a!s!^a!t!^a!u!^a!v!^a!y!^a!z!^a!{!^a!|!^a!}!^a#O!^a#P!^a#Q!^a#R!^a#S!^a#T!^a#U!^a#V!^a#W!^a#X!^a#Y!^a~OWUO`VOaUObUOcUO~Od!_O}^a!O^a!f^a#P^a!j^a!l^a!w^a~O!fPO!j#]O}ea!Oea!fea#Pea!lea!wea~O!fPO!l#]O}ea!Oea!fea#Pea!jea!wea~O!fPO}[a!O[a!f[a#P[a~OR!hO}ha!Oha!fha#Pha~OW#gO~OW#hO~OW#iO~OW#jO~O!i%dO!k$zO~P6jOa#nO~O}za!Oza!fza#Pza~P.dO!Q#pO~O}!Pa!O!Pa!f!Pa#P!Pa~P/YOQ#rO~OQ#sO~OQ#tO~OP#uO~O}pO!O#xO!fPO#PoO~O!g!YO~O!fPO!j#{O}ei!Oei!fei#Pei!lei!wei~O!fPO!l#{O}ei!Oei!fei#Pei!jei!wei~O!m#}O~O!f$OO!w$RO~O!fPO!w$RO~O}pO!O$^O!fPO#PoO~O}eq!Oeq!feq#Peq!weq~O!j$_O!leq~P=oO!l$_O!jeq~P=oOW$bO!f!]X!w!]X~O!O!OO!fPO!x$fO~P1WO!O!OO!fPO!x$pO~P1WOW$bO~O!jea~P7gO!lea~P8RO!jei~P;tO!lei~P<`O!fPO!i%kO!k$xO~P6jO!fPO!i$vO!k$yO~P6jO!fPO!i%lO!k$wO~P6jO!fPO!i%dO!k$zO~P6jO!j[a~P8mO!j[a!l[a!w[a~P8mO!fPO!f[a!l[a!w[a~O!fPO!f[a!j[a!w[a~O!fPO!f[a!w[a~O!l[a~P8mO!jZX~P+RO!jZX!lZX!wZX~P+RO!fPO!fZX!lZX!wZX~O!fPO!fZX!jZX!wZX~O!fPO!fZX!wZX~O!lZX~P+RO",
  goto: "1i!ePPPPPP!f!lP!u#S#]$o%g&|(RPPPPP&|#S#S#S#S)Z)d)Z)Z)Z)Z)Z)Z)Z)Z)v)Z)Z)Z)Z)Z)Z*j+bPP)ZP)Z)Z)Z)Z)Z)Z)Z)ZP+z,U/|0Z0a1P1V1]1cX!QO!R$R$g_SOQT!R!U$R$gW!PO!R$R$gS!XQTR#S!U_|OQT!R!U$R$g^_OQT!R!U$R$gU!bX$v%dU!dY$w$zQ!g^Q#V!ZU#Z!a%O%QU#^!c%R%UQ#k!qQ#l!rQ#y#UU$q$u%k%lU$r$x$y${U$s$|$}%PV$t%S%T%V!k]OQTXY^!R!U!Z!a!c!q!r#U$R$g$u$v$w$x$y$z${$|$}%O%P%Q%R%S%T%U%V%d%k%ld[OQT^!R!U!Z#U$R$g^#`!e%W%X%Y%Z%[%][#c!j!k!l!s#}$`W%eX!a$u$|`%f$v$w$x$}%O%R%S%kW%g$y$z%T%UW%h%P%Q%d%lS%i!q!rX%jY!c${%V#VZOQTXY^!R!U!Z!a!c!e!j!k!l!q!r!s#U#}$R$`$g$u$v$w$x$y$z${$|$}%O%P%Q%R%S%T%U%V%W%X%Y%Z%[%]%d%k%l#UWOQTXY^!R!U!Z!a!c!e!j!k!l!q!r!s#U#}$R$`$g$u$v$w$x$y$z${$|$}%O%P%Q%R%S%T%U%V%W%X%Y%Z%[%]%d%k%lR#X!__{OQT!R!U$R$gQ#d!jQ#e!kQ#f!lQ#m!sQ$a#}R$m$`Q$S#hQ$U#iQ$W#jQ$Y#kQ$[#lS$c$P$QQ$h$TQ$i$VQ$j$XQ$k$ZR$n$dW}O!R$R$gW!VQT!O!PS!tq!vS!wr!yW#Q!U!W!X#OU#v#R#S#TS$]#w#xR$l$^}pOQTqr!O!P!R!U!W!X!v!y#O#R#S#T#w#x$R$^$gQ!ROS#P!R$gR$g$RWQO!R$R$g!j!TQ![!a!c!e!j!k!l!s#O#T#U#w$P$T$V$X$Z$`$d$|$}%O%P%Q%R%S%T%U%V%W%X%Y%Z%[%]Q![SQ!aXQ!cYS!e[!fQ!jaQ!kbQ!lcQ!snQ#O!PQ#T!XQ#U!ZQ#[!bS#]$q$rQ#_!dQ#w#SQ#z#ZS#{$s$tQ#|#^Q$P#hQ$T#iQ$V#jQ$X#kQ$Z#lQ$`#}Q$d$QQ$|$uQ$}%kQ%O$vQ%P%lQ%Q%dQ%R$wQ%S$xQ%T$yQ%U$zQ%V${S%W%^%eS%X%_%fS%Y%`%gS%Z%a%hS%[%b%iT%]%c%jWTO!R$R$gQ!UQT!]T!UQ!`WR#Y!`Q!f[^#a!f%^%_%`%a%b%cQ%^%eQ%_%fQ%`%gQ%a%hQ%b%iR%c%jQ!i`R#b!iQ$Q#hR$e$QQ!vqR#o!vQ!yrR#q!y",
  nodeNames: "⚠ DelimitedString UndelimitedString MacroArgument MacroSymbol Program Instruction Label Symbol Statement Origin Expression ExprGroup BasicExpression BinaryOp Element UnaryOp Integer ASCII CLC BinaryOperator ParenExpr Assign ExprStatement Invocation PseudoStatement Page Param Field Reloc FixMri FixTab Expunge Decimal Octal Define MacroBody IfDef IfNDef IfZero IfNZro ZBlock Dubl StatementEnd Separator EOL Comment Fltg Float Device FileName EnPunch NoPunch Pause XList Eject Text EOF",
  maxTerm: 102,
  skippedNodes: [0],
  repeatNodeCount: 9,
  tokenData: "'y~RmXY!|YZ#R[]!|]^!|pq!|qr#Wrs#]tu#tuv#Wvw#Wxy$Yyz$_z{$d{|$i|}$p}!O$i!O!P$u!P!Q%w!Q![&c!]!^&v!^!_&{!_!`'Q!`!a'V!c!}'[!}#O'j#P#Q'o#Q#R#W#T#o'[~~'t~#RO!f~~#WO}~Q#]OdQ~#`RO;'S#i;'S;=`#n<%lO#i~#nOb~~#qP;=`<%l#i~#yR!Z~O;'S#t;'S;=`$S<%lO#t~$VP;=`<%l#t~$_O!i~~$dO!j~~$iO!h~V$pOdQ`T~$uO!g~V$zPcP!Q![$}U%SR!QU!Q![$}!g!h%]#X#Y%]U%`R{|%i}!O%i!Q![%oU%lP!Q![%oU%tP!QU!Q![%o~%|T!O~OY%wZ]%w^;'S%w;'S;=`&]<%lO%w~&`P;=`<%l%wV&jS!QUaP!O!P$}!Q![&c!g!h%]#X#Y%]~&{O#P~~'QO!w~~'VO!m~~'[O!x~~'aRW~!Q!['[!c!}'[#T#o'[~'oO!k~~'tO!l~~'yO!Z~",
  tokenizers: [readDelimitedString, readUndelimitedString, readMacroArguments, 0, 1, 2],
  topRules: {"Program":[0,5]},
  specialized: [{term: 8, get: (value: any, stack: any) => (specializeSymbol(value, stack) << 1), external: specializeSymbol},{term: 8, get: (value: any) => (spec_Symbol as any)[value] || -1}],
  tokenPrec: 0
})
