using Microsoft.EntityFrameworkCore;
using AcademicProgram = FutureWings.Domain.Entities.Program;
using FutureWings.Domain.Entities;

namespace FutureWings.Infrastructure.Data;

public static class DiscoverySeeder
{
    public static async Task SeedAsync(FutureWingsDbContext context)
    {
        var seeds = new[]
        {
            // === UNITED STATES ===
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Stanford University", "Stanford, CA", "MS Computer Science (AI Track)", "Master's", 58000m, 24, 98, "Top Tier,AI & Robotics,Silicon Valley Hub"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Stanford University", "Stanford, CA", "BS Symbolic Systems", "Bachelor's", 62000m, 48, 95, "Interdisciplinary,Cognitive AI,Silicon Valley Hub"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Massachusetts Institute of Technology", "Cambridge, MA", "Master of Engineering in EECS", "Master's", 59000m, 24, 99, "World #1,Cutting-edge Research,STEM Designated"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Massachusetts Institute of Technology", "Cambridge, MA", "PhD in Artificial Intelligence", "Doctorate", 0m, 48, 97, "Fully Funded,Fellowship,Top Research"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "University of California, Berkeley", "Berkeley, CA", "Master of Information and Data Science", "Master's", 44000m, 20, 96, "Data Science,Big Data,Bay Area Network"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "University of California, Berkeley", "Berkeley, CA", "BS Electrical Engineering & Computer Science", "Bachelor's", 48000m, 48, 94, "Top Public Ivy,High Starting Salary,Silicon Valley"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Carnegie Mellon University", "Pittsburgh, PA", "MS in Software Engineering", "Master's", 52000m, 16, 97, "Top SE Program,Industry Capstone,STEM"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Carnegie Mellon University", "Pittsburgh, PA", "MS in Robotics", "Master's", 54000m, 24, 96, "Robotics Institute,Autonomous Systems,Research"),

            // === CANADA ===
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Toronto", "Toronto, ON", "MSc Computer Science", "Master's", 31000m, 24, 96, "AI & Data,Vector Institute,Co-op Available"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Toronto", "Toronto, ON", "BSc Computer Science (Co-op)", "Bachelor's", 42000m, 48, 94, "Paid Internships,Downtown Tech Hub,PGWP Eligible"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of British Columbia", "Vancouver, BC", "Master of Data Science", "Master's", 36000m, 12, 93, "Accelerated,Industry Capstone,Coastal Tech"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of British Columbia", "Vancouver, BC", "BSc Cognitive Systems", "Bachelor's", 38000m, 48, 90, "AI & Psychology,Vancouver Tech,Research"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Waterloo", "Waterloo, ON", "Bachelor of Software Engineering (Co-op)", "Bachelor's", 45000m, 60, 97, "World Renowned Co-op,Silicon Valley Feeder,High ROI"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Waterloo", "Waterloo, ON", "Master of Mathematics in Computer Science", "Master's", 28000m, 24, 95, "Strong Math Core,Research Grant,High Employment"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "McGill University", "Montreal, QC", "MSc Computer Science (Mila AI)", "Master's", 26000m, 24, 92, "Deep Learning,Mila Institute,Bilingual City"),

            // === UNITED KINGDOM ===
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Oxford", "Oxford", "MSc in Advanced Computer Science", "Master's", 42000m, 12, 97, "Historic Prestige,1-Year Degree,High Career Impact"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Cambridge", "Cambridge", "MPhil in Machine Learning and Machine Intelligence", "Master's", 46000m, 12, 98, "Silicon Fen,Top ML Faculty,Prestigious"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "Imperial College London", "London", "MSc Computing (Artificial Intelligence)", "Master's", 45000m, 12, 95, "Central London,Tech Unicorns,High Employability"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Manchester", "Manchester", "MSc Data Science", "Master's", 38000m, 12, 88, "One-Year Degree,Industrial Advisory,Career Support"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Edinburgh", "Edinburgh", "MSc Artificial Intelligence", "Master's", 39000m, 12, 91, "Oldest AI Group in UK,Research Excellence,Bayes Centre"),

            // === GERMANY ===
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Technical University of Munich", "Munich", "MSc Informatics", "Master's", 6500m, 24, 94, "Top in Germany,Industry Powerhouse,Bavarian Tech"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Technical University of Munich", "Munich", "MSc Data Engineering and Analytics", "Master's", 6500m, 24, 93, "Big Data,Cloud Architectures,English Taught"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "RWTH Aachen University", "Aachen", "MSc Computer Engineering", "Master's", 800m, 24, 90, "Nearly Free Tuition,Excellence University,Automotive Tech"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Technical University of Berlin", "Berlin", "MSc Computer Science (English Taught)", "Master's", 800m, 24, 91, "Startup Capital Berlin,Low Cost,English Taught"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Heidelberg University", "Heidelberg", "MSc Scientific Computing", "Master's", 3200m, 24, 88, "Germany Oldest University,Biotech,High Performance Computing"),

            // === AUSTRALIA ===
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of Melbourne", "Melbourne, VIC", "Master of Information Technology", "Master's", 34000m, 24, 89, "Melbourne Connect,Industry Projects,Global Network"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of Melbourne", "Melbourne, VIC", "Master of Data Science", "Master's", 36000m, 24, 88, "Statistical Modeling,Industry Capstone,High Demand"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of Sydney", "Sydney, NSW", "Master of Cybersecurity", "Master's", 35000m, 24, 87, "Cyber Defense,Global City,Extended Work Visa"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of New South Wales", "Sydney, NSW", "Master of Information Technology (AI Track)", "Master's", 35000m, 24, 89, "Group of Eight,Robotics Lab,Fintech"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "Australian National University", "Canberra, ACT", "Master of Computing (Artificial Intelligence)", "Master's", 33000m, 24, 88, "National Research Capital,CSIRO Collaboration,Top Rank"),

            // === NETHERLANDS ===
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "University of Amsterdam", "Amsterdam", "MSc Artificial Intelligence", "Master's", 18500m, 24, 92, "Amsterdam Science Park,Deep Learning,English Taught"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "University of Amsterdam", "Amsterdam", "BSc Business Analytics", "Bachelor's", 14200m, 36, 86, "English Taught,Fintech,International Community"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "Delft University of Technology", "Delft", "MSc Computer Science (Software Tech)", "Master's", 19000m, 24, 93, "Top Tech University,Quantum & AI,High Graduate Salaries"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "Delft University of Technology", "Delft", "MSc Robotics", "Master's", 19500m, 24, 92, "RoboValley,Mechatronics,High Employability"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "Eindhoven University of Technology", "Eindhoven", "MSc Data Science and AI", "Master's", 17000m, 24, 89, "Brainport Region,ASML & Philips Network,Tech Hub"),

            // === SWEDEN ===
            new Seed("SE", "Sweden", "Leader in green innovation, sustainability, and English-taught Master's", true,
                "KTH Royal Institute of Technology", "Stockholm", "MSc Machine Learning", "Master's", 16000m, 24, 91, "Stockholm Tech Unicorns,Spotify Hub,English Taught"),
            new Seed("SE", "Sweden", "Leader in green innovation, sustainability, and English-taught Master's", true,
                "KTH Royal Institute of Technology", "Stockholm", "MSc Software Engineering of Distributed Systems", "Master's", 16000m, 24, 89, "Cloud Systems,Cybersecurity,High Salaries"),
            new Seed("SE", "Sweden", "Leader in green innovation, sustainability, and English-taught Master's", true,
                "Chalmers University of Technology", "Gothenburg", "MSc Computer Science: Algorithms and Logic", "Master's", 15500m, 24, 88, "Automotive Tech (Volvo),AI Labs,High Quality of Life"),

            // === SWITZERLAND ===
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "ETH Zurich", "Zurich", "Master in Computer Science", "Master's", 1800m, 24, 98, "World Top 10,Google & Disney Research Labs,Ultra Low Tuition"),
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "ETH Zurich", "Zurich", "Master in Data Science", "Master's", 1800m, 24, 97, "Max Planck Institute Partner,Swiss Banking Tech,Top ROI"),
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "EPFL", "Lausanne", "MSc in Computer Science", "Master's", 1600m, 24, 96, "Lake Geneva Innovation Hub,Cybersecurity,Low Tuition"),
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "EPFL", "Lausanne", "MSc in Robotics", "Master's", 1600m, 24, 95, "World Renowned Robotics,Swiss Tech,High Salaries"),

            // === SINGAPORE ===
            new Seed("SG", "Singapore", "Asia's premier financial and AI innovation gateway", false,
                "National University of Singapore", "Singapore", "Master of Computing (AI Specialisation)", "Master's", 38000m, 18, 96, "Asia #1,Global Financial Capital,Silicon Island"),
            new Seed("SG", "Singapore", "Asia's premier financial and AI innovation gateway", false,
                "National University of Singapore", "Singapore", "Bachelor of Computing in Computer Science", "Bachelor's", 29000m, 48, 95, "World Top 10 CS,Multinational HQs,High Salary"),
            new Seed("SG", "Singapore", "Asia's premier financial and AI innovation gateway", false,
                "Nanyang Technological University", "Singapore", "MSc in Artificial Intelligence", "Master's", 36000m, 12, 94, "Ranked #1 Young University,Smart Nation Projects,Fast Track"),

            // === JAPAN ===
            new Seed("JP", "Japan", "Pioneering robotics, engineering, and government MEXT scholarships", false,
                "The University of Tokyo", "Tokyo", "Master of Information Science and Technology", "Master's", 4800m, 24, 93, "Todai,Japan #1,English Program,Robotics Hub"),
            new Seed("JP", "Japan", "Pioneering robotics, engineering, and government MEXT scholarships", false,
                "Kyoto University", "Kyoto", "Master in Intelligence Science and Technology", "Master's", 4800m, 24, 91, "Nobel Laureates,AI & Cognitive Science,Historic City"),
            new Seed("JP", "Japan", "Pioneering robotics, engineering, and government MEXT scholarships", false,
                "Tokyo Institute of Technology", "Tokyo", "MSc in Artificial Intelligence Systems", "Master's", 4800m, 24, 90, "Supercomputing Hub,MEXT Scholarship Eligible,English Taught"),

            // === FRANCE ===
            new Seed("FR", "France", "Renowned Grandes Écoles and vibrant Paris tech startup ecosystem", false,
                "Institut Polytechnique de Paris", "Palaiseau, Paris", "MSc in AI and Advanced Visual Computing", "Master's", 14000m, 24, 92, "Station F Tech Hub,Elite Grande École,Top Salaries"),
            new Seed("FR", "France", "Renowned Grandes Écoles and vibrant Paris tech startup ecosystem", false,
                "Sorbonne University", "Paris", "Master in Computer Science (Quantum & AI)", "Master's", 3800m, 24, 90, "Historic Prestige,Public Tuition,European AI Hub"),

            // === IRELAND ===
            new Seed("IE", "Ireland", "European tech HQ capital with 2-year post-study graduate work visa", false,
                "Trinity College Dublin", "Dublin", "MSc Computer Science (Data Science)", "Master's", 24500m, 12, 90, "Silicon Docks,Google/Meta HQs,Fast-Track Degree"),
            new Seed("IE", "Ireland", "European tech HQ capital with 2-year post-study graduate work visa", false,
                "University College Dublin", "Dublin", "MSc Computer Science (Advanced)", "Master's", 23000m, 16, 88, "Industry Partnerships,Ireland Tech Hub,2-Year Stay Back"),

            // === FINLAND ===
            new Seed("FI", "Finland", "Top education ranking, highest happiness index, and generous scholarships", false,
                "Aalto University", "Espoo", "MSc Machine Learning, Data Science and AI", "Master's", 16400m, 24, 91, "Slush Startup Ecosystem,Top AI Labs,Scholarships Available"),
            new Seed("FI", "Finland", "Top education ranking, highest happiness index, and generous scholarships", false,
                "Aalto University", "Espoo", "MSc Human-Computer Interaction", "Master's", 16400m, 24, 87, "Design & Tech,Full Scholarship Options,High Well-being"),
            new Seed("FI", "Finland", "Top education ranking, highest happiness index, and generous scholarships", false,
                "University of Helsinki", "Helsinki", "MSc Computer Science (Data Science Track)", "Master's", 15000m, 24, 89, "Birthplace of Linux,Elements of AI,Research Centered"),

            // === NEW ZEALAND ===
            new Seed("NZ", "New Zealand", "Safe, pristine environment with open post-study work permissions", false,
                "University of Auckland", "Auckland", "Master of Information Technology", "Master's", 29000m, 18, 87, "Auckland Tech Corridor,Post-Study Work Visa,Industry Internship"),
            new Seed("NZ", "New Zealand", "Safe, pristine environment with open post-study work permissions", false,
                "University of Otago", "Dunedin", "Master of Applied Science in Software Engineering", "Master's", 26000m, 12, 85, "Beautiful Campus,Supportive Community,Applied Projects")
        };

        foreach (var seed in seeds)
        {
            var country = await context.Countries.SingleOrDefaultAsync(item => item.Code == seed.CountryCode);
            if (country is null)
            {
                country = new Country
                {
                    Code = seed.CountryCode,
                    Name = seed.CountryName,
                    Description = seed.CountryDescription,
                    IsFeatured = seed.IsFeatured
                };
                context.Countries.Add(country);
                await context.SaveChangesAsync();
            }
            else
            {
                country.Name = seed.CountryName;
                country.Description = seed.CountryDescription;
                country.IsFeatured = seed.IsFeatured;
            }

            var university = await context.Universities.SingleOrDefaultAsync(item =>
                item.Name == seed.UniversityName && item.CountryId == country.Id);
            if (university is null)
            {
                university = new University { Name = seed.UniversityName, City = seed.City, Country = country };
                context.Universities.Add(university);
                await context.SaveChangesAsync();
            }
            else
            {
                university.City = seed.City;
            }

            var program = await context.Programs.SingleOrDefaultAsync(item =>
                item.Name == seed.ProgramName && item.UniversityId == university.Id);
            if (program is null)
            {
                program = new AcademicProgram { Name = seed.ProgramName, University = university };
                context.Programs.Add(program);
            }

            program.Level = seed.Level;
            program.AnnualTuitionUsd = seed.Tuition;
            program.DurationMonths = seed.DurationMonths;
            program.MatchScore = seed.MatchScore;
            program.Tags = seed.Tags;
            await context.SaveChangesAsync();
        }

        await SeedScholarshipsAsync(context);
        await SeedCommunityRatingsAsync(context);
    }

    private static async Task SeedScholarshipsAsync(FutureWingsDbContext context)
    {
        var scholarshipSeeds = new[]
        {
            new ScholarshipSeed("US", "Fulbright Foreign Student Program",
                "Enables graduate students, young professionals, and artists from abroad to study and conduct research in the United States.",
                "Bachelor's degree or equivalent, strong academic record, English proficiency, and demonstrated leadership.",
                "Academic transcripts, 3 letters of recommendation, TOEFL/IELTS report, personal statement, study objectives.",
                "Master's, Doctorate", "All fields", "https://foreign.fulbrightonline.org/", 35000m, 10),
            new ScholarshipSeed("US", "Knight-Hennessy Scholars at Stanford",
                "A multidisciplinary, multicultural graduate fellowship program providing full funding for graduate study at Stanford University.",
                "Applying to or enrolled in a full-time Stanford graduate program, bachelor's degree earned within last 7 years.",
                "Online application, resume, transcripts, 2 recommendation letters, video statement, essay responses.",
                "Master's, Doctorate, MBA, JD, MD", "All Stanford graduate fields", "https://knight-hennessy.stanford.edu/", 55000m, 10),
            new ScholarshipSeed("US", "Hubert H. Humphrey Fellowship",
                "Brings accomplished mid-career professionals from designated countries to the United States for an academic year of non-degree study and professional development.",
                "Undergraduate degree, 5+ years of full-time professional experience, demonstrated public service leadership.",
                "Resume/CV, project essay, professional references, English language assessment.",
                "Fellowship / Non-degree", "Public Policy, Leadership, Education, Climate", "https://www.humphreyfellowship.org/", 30000m, 9),
            new ScholarshipSeed("CA", "Vanier Canada Graduate Scholarships",
                "Attracts and retains world-class doctoral students to Canadian institutions with prestigious, highly competitive funding.",
                "Nominated by an eligible Canadian institution, first-class academic average, exceptional research potential and leadership.",
                "Doctoral research proposal, project references, leadership reference letters, official transcripts.",
                "Doctorate (PhD)", "Health, Natural Sciences, Engineering, Social Sciences", "https://vanier.gc.ca/", 50000m, 11),
            new ScholarshipSeed("CA", "Lester B. Pearson International Scholarship",
                "Recognizes exceptional international undergraduate students who demonstrate outstanding academic achievement and creativity at University of Toronto.",
                "International secondary school graduate nominated by school counselor, strong community leadership.",
                "School nomination letter, student application essay, academic transcripts, English proficiency.",
                "Bachelor's", "All undergraduate programs at U of T", "https://future.utoronto.ca/pearson/", 40000m, 1),
            new ScholarshipSeed("CA", "Ontario Graduate Scholarship (OGS)",
                "Merit-based funding for outstanding graduate students pursuing master's or doctoral studies in Ontario universities.",
                "Enrolled in an eligible Ontario graduate program, minimum A- average (80%) in past two years.",
                "Transcripts, two academic references, research statement / study plan.",
                "Master's, Doctorate", "All disciplines", "https://osap.gov.on.ca/", 15000m, 3),
            new ScholarshipSeed("GB", "Chevening Scholarships for Global Leaders",
                "UK government's prestigious global scholarship programme for outstanding emerging leaders to undertake a one-year master's in the UK.",
                "Citizen of a Chevening-eligible country, minimum 2 years work experience, undergraduate degree with 2:1 honours or equivalent.",
                "Degree transcripts, English proficiency, 2 references, 4 Chevening essays, unconditional UK offer.",
                "Master's", "All eligible 1-year Master's programs", "https://www.chevening.org/", 38000m, 11),
            new ScholarshipSeed("GB", "Commonwealth Masters Scholarships",
                "Supports candidates from Commonwealth countries who could not otherwise afford to study in the UK.",
                "Citizen or refugee status in an eligible Commonwealth country, minimum upper second class (2:1) undergraduate degree.",
                "Official transcripts, 2 reference letters, development impact statement, university admission offer.",
                "Master's", "Development-focused fields", "https://cscuk.fcdo.gov.uk/", 32000m, 12),
            new ScholarshipSeed("GB", "Rhodes Scholarships at Oxford",
                "The oldest and perhaps most prestigious international scholarship programme, enabling outstanding young people to study at the University of Oxford.",
                "Exceptional academic achievement, moral character, commitment to service, and leadership instincts.",
                "Oxford application, 4-8 reference letters, academic transcripts, CV, personal statement.",
                "Master's, Doctorate", "All Oxford postgraduate courses", "https://www.rhodeshouse.ox.ac.uk/", 45000m, 10),
            new ScholarshipSeed("DE", "DAAD Master Studies Scholarships",
                "Offers graduates from all fields the opportunity to pursue a postgraduate or Master's degree at a state-recognized German university.",
                "Completed Bachelor's degree within the last 6 years with above-average grades, English or German proficiency.",
                "Tabular CV, letter of motivation (1-3 pages), degree certificate, transcripts, language certificate.",
                "Master's", "All academic disciplines", "https://www.daad.de/en/", 22000m, 11),
            new ScholarshipSeed("DE", "Deutschlandstipendium National Merit Grant",
                "National merit scholarship awarded by German universities and matching private sponsors to high-achieving students.",
                "Enrolled or admitted to a participating German university, top academic performance, social engagement.",
                "University enrollment proof, CV, high school / university transcripts, motivation letter.",
                "Bachelor's, Master's", "All disciplines", "https://www.deutschlandstipendium.de/", 3600m, 7),
            new ScholarshipSeed("DE", "Heinrich Böll Foundation Research Grant",
                "Awards scholarships to international graduates and PhD students who share the foundation's green socio-political values.",
                "Excellent academic record, active socio-political engagement, German language proficiency (B2/DSH).",
                "Detailed CV, motivation letter, social engagement reference, academic reference, certified transcripts.",
                "Master's, Doctorate", "Social sciences, ecology, sustainability, humanities", "https://www.boell.de/en/", 16000m, 9),
            new ScholarshipSeed("AU", "Australia Awards Scholarships",
                "Long-term development awards administered by DFAT for emerging leaders from developing countries.",
                "Citizen of participating country, minimum 18 years old, relevant work experience, IELTS 6.5+.",
                "Academic qualifications, employer endorsement, development impact plan, English test scores.",
                "Master's, Doctorate", "Priority development sectors", "https://www.dfat.gov.au/people-to-people/australia-awards", 35000m, 4),
            new ScholarshipSeed("AU", "Melbourne International Research Scholarship",
                "Awarded to high-achieving international research students undertaking graduate research degrees at University of Melbourne.",
                "Completed tertiary degree equivalent to Australian 4-year honours with H1 average, research publication record.",
                "Research proposal, academic transcripts, 2 referee reports, supervisor endorsement.",
                "Doctorate (PhD), Master's by Research", "All research disciplines", "https://scholarships.unimelb.edu.au/", 37000m, 10),
            new ScholarshipSeed("AU", "Destination Australia Regional Scholarship",
                "Australian Government initiative funding tertiary students to study in regional and remote Australia.",
                "Commencing full-time study at a regional campus, maintaining primary residence in a regional area.",
                "Course acceptance letter, academic transcripts, statement of regional community commitment.",
                "Bachelor's to Doctorate", "All regional campus programs", "https://www.education.gov.au/destination-australia", 15000m, 1),
            new ScholarshipSeed("NL", "NL Scholarship (Holland Scholarship)",
                "Financed by the Dutch Ministry of Education for international students from outside the EEA wishing to study in the Netherlands.",
                "Non-EEA nationality, applying for a full-time bachelor's or master's at a participating Dutch research university.",
                "University admission letter, motivation letter, CV, academic transcript, English proficiency (IELTS/TOEFL).",
                "Bachelor's, Master's", "All programs at participating universities", "https://www.studyinnl.org/", 10000m, 5),
            new ScholarshipSeed("NL", "Amsterdam Merit Scholarship (AMS)",
                "Awarded by University of Amsterdam to outstanding international students from outside the EU/EEA.",
                "Belong to top 10% of graduating class, admitted to a Master's degree program at UvA.",
                "GPA evidence, CV, letter of motivation, 2 reference letters, English language test results.",
                "Master's", "Economics, Science, Humanities, Law", "https://www.uva.nl/scholarships", 25000m, 1),
            new ScholarshipSeed("NL", "Erasmus+ European Masters Grant",
                "EU-funded master's scholarships covering participation costs, travel allowance, and living stipend for international students.",
                "Undergraduate degree, high academic achievement, proficiency in languages of instruction.",
                "Certified degree certificate, transcripts, motivation letter, CV, 2 recommendation letters.",
                "Master's", "Erasmus Mundus Joint Master Degrees", "https://erasmus-plus.ec.europa.eu/", 28000m, 2),
            new ScholarshipSeed("SE", "Swedish Institute Scholarships for Global Professionals",
                "Fully-funded scholarship for global professionals to develop leadership and contribute to the UN 2030 Agenda in Sweden.",
                "Citizen of eligible SI country, minimum 3,000 hours demonstrated work experience, leadership track record.",
                "SI CV template, 2 letters of reference (one from employer), proof of work experience, motivation statement.",
                "Master's", "Eligible SI Master's programmes", "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/", 30000m, 2),
            new ScholarshipSeed("CH", "Swiss Government Excellence Scholarships",
                "Promotes international exchange and research cooperation between Switzerland and over 180 other countries.",
                "Master's degree or equivalent, exceptional academic research profile, Swiss professor mentor confirmation.",
                "Research proposal, CV, letter from Swiss academic host, 2 letters of recommendation, medical certificate.",
                "Doctorate (PhD), Postdoctoral", "All academic fields", "https://www.sbfi.admin.ch/scholarships_eng", 32000m, 11),
            new ScholarshipSeed("CH", "ETH Zurich Excellence Scholarship (ESOP)",
                "Supports outstanding students with a full scholarship covering tuition and living expenses for their Master's studies at ETH.",
                "Graduated with very good result (top 10% of bachelor's program), admission to an ETH Master's program.",
                "Pre-proposal for Master's thesis, 2 reference letters from professors, CV, certified transcripts.",
                "Master's", "All ETH Zurich Master's programs", "https://ethz.ch/students/en/studies/financial/scholarships/excellence-scholarship.html", 34000m, 12),
            new ScholarshipSeed("SG", "Singapore International Graduate Award (SINGA)",
                "A collaboration between A*STAR, NTU, NUS, and SUTD to attract talented international PhD researchers to Singapore.",
                "All international graduates with passion for research and excellent academic results, strong English proficiency.",
                "Valid passport, transcripts, bachelor's & master's degree certificates, 2 academic recommendation reports.",
                "Doctorate (PhD)", "Biomedical Sciences, Physical Sciences, Engineering", "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa", 42000m, 12),
            new ScholarshipSeed("JP", "MEXT Japanese Government Research Scholarship",
                "Prestigious Japanese government scholarship covering full tuition, monthly stipend, and round-trip airfare.",
                "Under 35 years of age, college graduate with 16+ years schooling, willingness to learn Japanese.",
                "Field of study and research plan, academic transcripts, recommendation from university president/dean, medical certificate.",
                "Master's, Doctorate", "All fields related to applicant's major", "https://www.studyinjapan.go.jp/en/planning/scholarship/mext-scholarships/", 24000m, 5),
            new ScholarshipSeed("FR", "Eiffel Excellence Scholarship Program",
                "French Ministry for Europe and Foreign Affairs program to attract top international master's and PhD students.",
                "Non-French nationality, up to 25 years old for Master's or 30 for PhD, nominated by French higher education institution.",
                "Institution nomination file, academic transcripts, resume, language proficiency, professional project statement.",
                "Master's, Doctorate", "Engineering, Sciences, Economics, Management, Law", "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence", 26000m, 1),
            new ScholarshipSeed("IE", "Government of Ireland International Education Scholarship",
                "Prestigious national scholarship awarded to high-calibre non-EU/EEA students studying in Ireland.",
                "Domiciled outside EU/EEA, possess an offer of a place on an eligible Irish higher education programme.",
                "Two references, personal statement, academic transcripts, Irish institution offer letter.",
                "Master's, Doctorate", "All disciplines", "https://hea.ie/funding-governance-performance/funding/student-finance/government-of-ireland-international-education-scholarships/", 20000m, 3),
            new ScholarshipSeed("FI", "Finland Scholarship for Master's Degrees",
                "Funded by the Finnish Ministry of Education and Culture for gifted non-EU/EEA students admitted to Finnish universities.",
                "Non-EU/EEA citizen liable for tuition fees, admitted to an eligible international Master's programme.",
                "Online university application, certified degree certificates, transcript of records, English proficiency test (IELTS/TOEFL).",
                "Master's", "All participating Finnish university Master's programmes", "https://www.studyinfinland.fi/scholarships/finland-scholarships", 18000m, 1)
        };

        for (var index = 0; index < scholarshipSeeds.Length; index++)
        {
            var seed = scholarshipSeeds[index];
            var country = await context.Countries.SingleOrDefaultAsync(c => c.Code == seed.CountryCode);
            if (country is null) continue;

            var existing = await context.Scholarships.SingleOrDefaultAsync(s => s.Name == seed.Name && s.CountryId == country.Id);
            if (existing is null)
            {
                existing = new Scholarship
                {
                    Name = seed.Name,
                    CountryId = country.Id
                };
                context.Scholarships.Add(existing);
            }
            existing.Description = seed.Description;
            existing.EligibilityCriteria = seed.EligibilityCriteria;
            existing.RequiredDocuments = seed.RequiredDocuments;
            existing.StudyLevel = seed.StudyLevel;
            existing.FieldOfStudy = seed.FieldOfStudy;
            existing.OfficialLink = seed.OfficialLink;
            existing.AwardAmount = seed.AwardAmount;
            existing.Deadline = new DateTimeOffset(2027, seed.DeadlineMonth, 15, 23, 59, 0, TimeSpan.Zero);
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedCommunityRatingsAsync(FutureWingsDbContext context)
    {
        // Clean up any temporary or adversarial test payload reviews left from prior security tests
        var dirtyRatings = await context.Ratings
            .Where(r => r.Comment != null && (r.Comment.Contains("<script") || r.Comment.Contains("<img") || r.Comment.Contains("<iframe")))
            .ToListAsync();
        if (dirtyRatings.Count > 0)
        {
            context.Ratings.RemoveRange(dirtyRatings);
            await context.SaveChangesAsync();
        }

        // Check if demo user exists for ratings
        var demoUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "demo.reviewer@futurewings.io");
        if (demoUser is null)
        {
            demoUser = new User
            {
                Email = "demo.reviewer@futurewings.io",
                PasswordHash = "$2a$11$eDemoReviewerHashPlaceholderNotForDirectLogin99812",
                Role = "Student",
                SubscriptionTier = "Pro",
                HasSeededDeadlines = true
            };
            context.Users.Add(demoUser);
            await context.SaveChangesAsync();

            context.UserProfiles.Add(new UserProfile
            {
                UserId = demoUser.Id,
                FirstName = "Aria",
                LastName = "Chen",
                Major = "Computer Science",
                DegreeLevel = "Master's",
                Cgpa = 3.92m,
                BudgetUsd = 35000m
            });
            await context.SaveChangesAsync();
        }

        var reviewSeeds = new[]
        {
            ("University of Toronto", 5, "The Vector Institute affiliation and Toronto's tech scene are incredible. Co-op program landed me an internship in 4 months!"),
            ("Technical University of Munich", 5, "World-class engineering education and practically zero tuition. Munich's tech ecosystem with BMW and Siemens is unbeatable."),
            ("Stanford University", 5, "Access to Silicon Valley venture capital and top AI researchers is unparalleled. Best decision of my academic life."),
            ("ETH Zurich", 5, "Rigorous curriculum, cutting-edge labs, and Zurich is beautiful. High quality of life with extremely affordable semester fees."),
            ("University of Melbourne", 5, "Melbourne Connect is a fantastic innovation hub. Very supportive international student community and great career fairs."),
            ("University of Amsterdam", 4, "High quality English-taught AI program in the heart of Europe. Great student vibe and cycling culture."),
            ("KTH Royal Institute of Technology", 5, "Stockholm's tech startup scene (Spotify, Klarna) recruits directly on campus. Very collaborative professors."),
            ("Imperial College London", 5, "Intense 1-year Master's degree with immediate connections to London fintech and AI startups."),
            ("University of Waterloo", 5, "Co-op program is legendary. 6 internships during undergraduate degree with Silicon Valley tech giants."),
            ("National University of Singapore", 5, "Asia's absolute best tech campus. State-of-the-art facilities and massive recruitment from global multinationals.")
        };

        foreach (var (uniName, score, comment) in reviewSeeds)
        {
            var uni = await context.Universities.FirstOrDefaultAsync(u => u.Name == uniName);
            if (uni is null) continue;

            var existing = await context.Ratings.FirstOrDefaultAsync(r => r.UniversityId == uni.Id && r.UserId == demoUser.Id);
            if (existing is null)
            {
                context.Ratings.Add(new Rating
                {
                    UserId = demoUser.Id,
                    UniversityId = uni.Id,
                    Score = score,
                    Comment = comment
                });
            }
        }
        await context.SaveChangesAsync();
    }

    private sealed record Seed(
        string CountryCode,
        string CountryName,
        string CountryDescription,
        bool IsFeatured,
        string UniversityName,
        string City,
        string ProgramName,
        string Level,
        decimal Tuition,
        int DurationMonths,
        int MatchScore,
        string Tags);

    private sealed record ScholarshipSeed(
        string CountryCode,
        string Name,
        string Description,
        string EligibilityCriteria,
        string RequiredDocuments,
        string StudyLevel,
        string FieldOfStudy,
        string OfficialLink,
        decimal AwardAmount,
        int DeadlineMonth);
}
