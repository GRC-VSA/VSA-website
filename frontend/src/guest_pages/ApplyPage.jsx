import "./ApplyPage.css";
import noapplication from "../assets/guest/noapplication.png"
const ApplyPage = () => {
    return (
        <main className="apply-page page-footer-space">
            <div className="recruitment-coming-soon">
                <div className="recruit-image-placeholder">
                    <img src={noapplication}/>
                </div>

                <h1>
                    We are not recruiting at the moment.<br></br>
                    Hope to see you again soon!
                </h1>
            </div>
        </main>
    );
}

export default ApplyPage;