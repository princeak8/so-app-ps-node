const ncc = [
    'gereguGs/pv', 'gereguGs/status',
    'omotoso2ts/tv',
    'omotoso11ts/pv', 
    'omotoso12ts/pv',
    'olorunsogo2ts/tv', 'olorunsogo2ts/status',
    'olorunsogo1ts/pv', 'olorunsogo1ts/status',
    'alaojinippts/tv',
    // 'dadinkowags/tv',
    'ps/dadinkowa/hydro/gombe/pd',
    'gbaraints/pv', 'gbaraints/status',
    // 'OkpaiippGs/tv', 'OkpaiippGs/status',
    // 'parasenergyPs/pv',
    'eketts/tv', 'eketts/status',
    'ekimts/tv', 'ekimts/status',
    'transamadi/tv'
];

const aws = [
    'ps/afam3/gas/rivers/pd',
    'ps/afam4/gas/rivers/pd',
    'ps/afam5/gas/rivers/pd',
    'ps/afam6/gas/rivers/pd',
    // 'afam4gs/pv',
    // 'afam5gs/pv', 'afam5gs/status',
    // 'afam6ts/tv', 'afam6ts/status',
    // 'delta2gs/pv',
    'ps/delta2/gas/delta/pd',
    'ps/delta3/gas/Delta/pd',
    'ps/delta4-1/gas/Delta/pd',
    'ps/delta4-2/gas/Delta/pd',
    'ps/paras_1/gas/lagos/pd',
    'ps/paras_2/gas/lagos/pd',
    'ps/okpai_1/gas/delta/pd',
    'ps/okpai_2/steam/delta/pd',
    'ps/shiroro/hydro/niger/pd',

    // 'delta4gs/tv',
    'ps/egbin/steam/lagos/pd',
    'ihovborts/tv', 'ihovborts/status',
    'jebbaTs/tv', 'jebbaTs/status',
    'kainjits/tv', 'kainjits/status',
    'odukpanits/pv', 'odukpanits/status',
    // 'OkpaiippGs/tv', 'OkpaiippGs/status',
    'omokugs/pv',
    'phmains/tv', 'phmains/status', 
    // 'parasenergyPs/pv',
    'riversIppPs/pr', 'riversIppPs/status',
    'sapelets/pv', 'sapelets/status',
    'ps/sapele/gas',
    // 'shirorogs/pv', 
    'transamadi/tv',
    'gbaraints/pv', 'gbaraints/status',
    'zungeru/tv', 'zungeru/status',
    'taopex/tv', 

    'afl/cs', 'kamSteel/cs', 'larfarge/cs', 'monarch/cs', 'ndphc/phoenix/ogun/pd',
    'ndphc/pulkit/lagos/pd', 'quantum/cs', 'starPipe/cs', 'ndphc/sunflag/lagos/pd', 'topSteel/cs',
    'bilateral/ikejaWest-sakate/lagos/pd',

    //MESL
    'mesl/zeberced/pd', 'mesl/inner-galaxy1/pd', 'mesl/inner-galaxy2/pd', 'mesl/niamey/pd',
    'mesl/ATVL/pd', 'mesl/PSML/pd', 'mesl/gazaoua/pd', 'mesl/Kam33/pd', 'mesl/amil/pd', 'mesl/aenl/pd',
    
    // Taopex
    'taopex/kamSteel/sagamu/pd', 'taopex/kamSteel/ilorin/pd', 'taopex/erKang/ilorin/pd',

    //FIPL
    'fipl/oaui/pd', 'fipl/fmpia/pd'
    
];

const topics = [...ncc, ...aws];

export default topics;