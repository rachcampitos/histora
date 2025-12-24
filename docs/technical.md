classDiagram
  class Patient {
    +_id : ObjectId
    +name : string
    +dni : string
    +birthDate : Date
    +isDeleted : boolean
  }

  class Doctor {
    +_id : ObjectId
    +name : string
    +specialty : string
    +licenseNumber : string
    +isDeleted : boolean
  }

  class ClinicalHistory {
    +_id : ObjectId
    +patient : ObjectId (ref: Patient)
    +doctor : ObjectId (ref: Doctor)
    +createdAt : Date
    +notes : string
    +isDeleted : boolean
  }

  ClinicalHistory --> Patient : belongs to
  ClinicalHistory --> Doctor : belongs to